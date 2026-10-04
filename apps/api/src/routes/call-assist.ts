import { randomUUID } from 'node:crypto';

import { zValidator } from '@hono/zod-validator';
import { format } from 'date-fns';
import { Hono } from 'hono';
import { z } from 'zod';

import {
  CallAssistRequestSchema,
  DEFAULT_CALL_RETRY,
  cancelSimulatedCall,
  createSimulatedCallTask,
  nextCallAttemptAt,
  retrySimulatedCallNow,
  simulatedCallStatus,
  type CallAssistRequest,
  type CallAssistResult,
  type CallAssistStartResponse,
  type CallAssistStatus,
  type CallRetry,
  type ISODate,
  type SimulatedCallTask,
} from '@naczas/shared';

import { errorResponse, validationMessage } from './common';
import { buildAssistant, type AssistantOptions } from '../call-assist/assistant';
import { sipBridgeTwiml, type TwilioClient } from '../call-assist/twilio-client';
import { rateLimit, type RateLimitOptions } from '../middleware/rate-limit';

import type { VapiCall, VapiClient } from '../call-assist/vapi-client';

export type CallAssistConfig = {
  vapi: VapiClient;
  /** The only number ever dialled (DEMO_CALL_TO) — never taken from the request */
  callTo: string;
  assistant?: AssistantOptions;
} & (
  | /** Vapi dials from a phone number imported into Vapi */
    { via: 'vapi-number'; phoneNumberId: string } /**
     * Twilio dials from a *verified caller ID* (no purchased number, no compliance profile) and,
     * once answered, bridges the call to the Vapi assistant over Vapi's free SIP URI.
     */
  | { via: 'twilio-sip'; twilio: TwilioClient; from: string; sipUri: string }
);

type Line = CallAssistStatus['transcript'][number];

/** One dial of a live task */
interface Attempt {
  startedAt: number;
  /** Live transcript pushed by the Vapi webhook (only when PUBLIC_URL is configured) */
  lines: Line[];
  vapiCallId?: string;
  /** twilio-sip: the per-call assistant (finds the Vapi call) and the Twilio leg */
  assistantId?: string;
  twilioSid?: string;
  /** Final status once this attempt is over — not re-fetched afterwards */
  final?: CallAssistStatus;
  /** Phone time of this attempt, kept once it ended */
  waitedSec?: number;
  talkedSec?: number;
}

interface LiveTask {
  mode: 'live';
  startedAt: number;
  req: CallAssistRequest;
  today: ISODate;
  retry: CallRetry;
  attempts: Attempt[];
  /** Next dial (ms epoch) while a retry is scheduled */
  nextAt: number | null;
  cancelledAt: number | null;
}

interface SimTask {
  mode: 'simulated';
  startedAt: number;
  sim: SimulatedCallTask;
}

type CallTask = LiveTask | SimTask;

const TTL_MS = 6 * 60 * 60_000; // a task with retries may span hours (and a night)

/**
 * In-memory registry of call tasks started by this instance. GET only answers for ids in here, so
 * the endpoint can't be used to read other calls on the Vapi account.
 */
export function createCallStore(now: () => number) {
  const tasks = new Map<string, CallTask>();
  return {
    add(id: string, task: CallTask) {
      for (const [key, t] of tasks) if (now() - t.startedAt > TTL_MS) tasks.delete(key);
      tasks.set(id, task);
    },
    get: (id: string) => tasks.get(id),
    /** Same task under a provider call id, so webhook events find it. */
    alias: (aliasId: string, task: CallTask) => tasks.set(aliasId, task),
    /** Distinct live tasks that may still change (for the background ticker). */
    activeLive(): [string, LiveTask][] {
      const seen = new Set<CallTask>();
      const out: [string, LiveTask][] = [];
      for (const [id, t] of tasks) {
        if (seen.has(t) || t.mode !== 'live') continue;
        seen.add(t);
        const last = t.attempts.at(-1);
        if (t.cancelledAt === null && (t.nextAt !== null || !last?.final)) out.push([id, t]);
      }
      return out;
    },
  };
}
export type CallStore = ReturnType<typeof createCallStore>;

const FAILED_REASON = /did-not-answer|busy|voicemail|error|failed|fault/i;
/** Nobody picked up — worth dialling again (unlike a configuration error). */
const RETRYABLE_REASON = /did-not-answer|no-answer|busy|voicemail/i;

export function mapVapiStatus(call: VapiCall): CallAssistStatus['status'] {
  switch (call.status) {
    case 'scheduled':
    case 'queued':
      return 'queued';
    case 'ringing':
      return 'ringing';
    case 'in-progress':
    case 'forwarding':
      // Connected, but until the clinic says something the agent is waiting on the line.
      return vapiTranscript(call).some((l) => l.role === 'clinic') ? 'in_progress' : 'on_hold';
    case 'ended':
      return call.endedReason && FAILED_REASON.test(call.endedReason) ? 'failed' : 'ended';
    default:
      return 'failed';
  }
}

/** Before Vapi picks up the SIP leg, the Twilio call is the only source of truth. */
export function mapTwilioStatus(status: string): CallAssistStatus['status'] {
  switch (status) {
    case 'queued':
    case 'initiated':
      return 'queued';
    case 'ringing':
      return 'ringing';
    case 'in-progress':
      return 'in_progress';
    default:
      return 'failed'; // busy, no-answer, failed, canceled, completed without reaching Vapi
  }
}

export function vapiTranscript(call: VapiCall): Line[] {
  const messages = call.artifact?.messages ?? call.messages ?? [];
  return messages.flatMap((m): Line[] => {
    const text = m.message?.trim();
    if (!text) return [];
    if (m.role === 'bot' || m.role === 'assistant') return [{ role: 'agent', text }];
    if (m.role === 'user') return [{ role: 'clinic', text }];
    return []; // system prompt, tool calls
  });
}

/**
 * Phone time of one Vapi call: everything until the clinic's first words counts as waiting
 * (ringing, IVR, hold music), the rest as talking.
 */
export function vapiPhoneTime(
  call: VapiCall,
  nowMs: number,
): { waitedSec: number; talkedSec: number } {
  const start = call.startedAt ? Date.parse(call.startedAt) : NaN;
  if (Number.isNaN(start)) return { waitedSec: 0, talkedSec: 0 };
  const end = call.endedAt ? Date.parse(call.endedAt) : nowMs;
  const total = Math.max(0, (end - start) / 1000);
  const messages = call.artifact?.messages ?? call.messages ?? [];
  const firstClinic = messages.find(
    (m) => m.role === 'user' && m.message?.trim(),
  )?.secondsFromStart;
  const waited = Math.min(total, firstClinic ?? total);
  return { waitedSec: Math.round(waited), talkedSec: Math.round(total - waited) };
}

const blankToNull = (s: string | null | undefined) => (s?.trim() ? s.trim() : null);

/** Vapi's post-call extraction is LLM output — validate it like any external data. */
const StructuredDataSchema = z.object({
  booked: z.boolean(),
  date: z.string().nullish(),
  time: z.string().nullish(),
  note: z.string().nullish(),
});

export function vapiResult(call: VapiCall): CallAssistResult | null {
  const parsed = StructuredDataSchema.safeParse(call.analysis?.structuredData);
  if (!parsed.success) return null;
  const date = blankToNull(parsed.data.date);
  const time = blankToNull(parsed.data.time);
  return {
    booked: parsed.data.booked,
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    time: time && /^\d{2}:\d{2}$/.test(time) ? time : null,
    note: blankToNull(parsed.data.note),
  };
}

/** Places one call to DEMO_CALL_TO; returns the new attempt and the provider's call id. */
async function dial(
  config: CallAssistConfig,
  req: CallAssistRequest,
  today: ISODate,
  startedAt: number,
): Promise<{ id: string; attempt: Attempt }> {
  const assistant = buildAssistant(req, today, config.assistant);
  if (config.via === 'vapi-number') {
    const call = await config.vapi.startCall({
      phoneNumberId: config.phoneNumberId,
      customer: { number: config.callTo },
      assistant,
    });
    return { id: call.id, attempt: { startedAt, lines: [], vapiCallId: call.id } };
  }
  // One assistant per call: the SIP URI answers with it, and it lets us find the call.
  const { id: assistantId } = await config.vapi.createAssistant(assistant);
  await config.vapi.routeSipUri(config.sipUri, assistantId);
  const tw = await config.twilio.startCall({
    from: config.from,
    to: config.callTo,
    twiml: sipBridgeTwiml(config.sipUri),
  });
  return { id: tw.sid, attempt: { startedAt, lines: [], assistantId, twilioSid: tw.sid } };
}

const sumStats = (task: LiveTask, current?: { waitedSec: number; talkedSec: number }) => {
  const done = task.attempts.filter((a) => a.final);
  return {
    attempts: task.attempts.length,
    waitedSec: done.reduce((s, a) => s + (a.waitedSec ?? 0), 0) + (current?.waitedSec ?? 0),
    talkedSec: done.reduce((s, a) => s + (a.talkedSec ?? 0), 0) + (current?.talkedSec ?? 0),
  };
};

/**
 * Brings a live task up to date: reads the current attempt from the provider, schedules a retry
 * when nobody answered, and dials when a scheduled retry is due. Called on GET and by the
 * background ticker, so retries happen even when no app is polling.
 */
async function refreshLive(
  callId: string,
  task: LiveTask,
  config: CallAssistConfig,
  store: CallStore,
  nowMs: number,
): Promise<CallAssistStatus> {
  const last = () => task.attempts.at(-1)!;
  const attemptInfo = () => ({
    number: task.attempts.length,
    max: task.retry.maxAttempts,
    nextAt: task.nextAt === null ? null : new Date(task.nextAt).toISOString(),
  });
  const withMeta = (
    s: Omit<CallAssistStatus, 'attempt' | 'stats' | 'callId'>,
    current?: { waitedSec: number; talkedSec: number },
  ) =>
    ({
      ...s,
      callId,
      attempt: attemptInfo(),
      stats: sumStats(task, current),
    }) satisfies CallAssistStatus;

  if (task.cancelledAt !== null) {
    const prev = last().final;
    return withMeta({
      status: 'cancelled',
      transcript: prev?.transcript ?? last().lines,
      result: null,
    });
  }

  if (task.nextAt !== null) {
    if (nowMs < task.nextAt) {
      return withMeta({ status: 'retry_scheduled', transcript: [], result: null });
    }
    task.nextAt = null;
    const { id, attempt } = await dial(config, task.req, task.today, nowMs);
    task.attempts.push(attempt);
    store.alias(id, task);
  }

  const attempt = last();
  if (attempt.final) return withMeta(attempt.final);

  let call: VapiCall | undefined;
  if (!attempt.vapiCallId && config.via === 'twilio-sip' && attempt.assistantId) {
    const [found] = await config.vapi.listCallsByAssistant(attempt.assistantId);
    if (found) {
      attempt.vapiCallId = found.id;
      store.alias(found.id, task);
      call = found;
    } else {
      // Not answered yet (or never): report the phone leg.
      const tw = await config.twilio.getCall(attempt.twilioSid!);
      const legStatus = mapTwilioStatus(tw.status);
      const waited = { waitedSec: Math.round((nowMs - attempt.startedAt) / 1000), talkedSec: 0 };
      if (legStatus !== 'failed') {
        // Answered: SIP still connecting → the agent is not talking yet.
        return withMeta(
          {
            status: legStatus === 'in_progress' ? 'ringing' : legStatus,
            transcript: [],
            result: null,
          },
          waited,
        );
      }
      return finishAttempt(
        { status: 'failed', transcript: [], result: null },
        waited,
        RETRYABLE_REASON.test(tw.status),
      );
    }
  }
  call ??= await config.vapi.getCall(attempt.vapiCallId ?? callId);

  const time = vapiPhoneTime(call, nowMs);
  const result = vapiResult(call);
  // A booked result wins over a scary endedReason (e.g. the clinic hung up first).
  const mapped = result?.booked ? 'ended' : mapVapiStatus(call);
  // Webhook lines can be ahead of Vapi's own message list.
  const status =
    mapped === 'on_hold' && attempt.lines.some((l) => l.role === 'clinic') ? 'in_progress' : mapped;
  // Webhook lines arrive live; after the call Vapi's own artifact is complete and cleaner.
  const transcript =
    call.status === 'ended' || attempt.lines.length === 0 ? vapiTranscript(call) : attempt.lines;
  const body = { status, transcript, result };
  if (call.status !== 'ended') return withMeta(body, time);
  // Ended but the post-call extraction isn't there yet: keep polling, don't freeze.
  if (status === 'ended' && result === null) return withMeta(body, time);
  return finishAttempt(body, time, !!call.endedReason && RETRYABLE_REASON.test(call.endedReason));

  function finishAttempt(
    s: Omit<CallAssistStatus, 'attempt' | 'stats' | 'callId'>,
    t: { waitedSec: number; talkedSec: number },
    retryable: boolean,
  ): CallAssistStatus {
    attempt.waitedSec = t.waitedSec;
    attempt.talkedSec = t.talkedSec;
    if (s.status === 'failed' && retryable && task.attempts.length < task.retry.maxAttempts) {
      task.nextAt = nextCallAttemptAt(nowMs, task.retry.intervalMin * 60_000);
      attempt.final = { callId, ...s };
      return withMeta({ status: 'retry_scheduled', transcript: [], result: null });
    }
    attempt.final = withMeta(s);
    return attempt.final;
  }
}

export function callAssistRoutes({
  config,
  store,
  now,
  startLimit,
  dailyLiveLimit = Infinity,
}: {
  config: CallAssistConfig | null;
  store: CallStore;
  now: () => Date;
  startLimit: RateLimitOptions;
  /** Live calls started per day; beyond it requests get the simulation (never an error) */
  dailyLiveLimit?: number;
}) {
  const liveStarted = { day: '', count: 0 };
  /** Reserves one live call for today, or false when the daily budget is spent. */
  const takeLiveSlot = (today: string) => {
    if (liveStarted.day !== today) Object.assign(liveStarted, { day: today, count: 0 });
    if (liveStarted.count >= dailyLiveLimit) return false;
    liveStarted.count += 1;
    return true;
  };

  const statusOf = async (callId: string, task: CallTask): Promise<CallAssistStatus> =>
    task.mode === 'simulated'
      ? simulatedCallStatus(callId, task.sim, now().getTime())
      : refreshLive(callId, task, config!, store, now().getTime());

  const withTask =
    (handler: (callId: string, task: CallTask) => Promise<Response> | Response) =>
    async (
      c: { req: { param: (k: 'callId') => string } } & Parameters<typeof errorResponse>[0],
    ) => {
      const callId = c.req.param('callId');
      const task = store.get(callId);
      if (!task) return errorResponse(c, 404, 'unknown_call', 'Unknown call id');
      try {
        return await handler(callId, task);
      } catch (err) {
        console.error(err);
        return errorResponse(c, 502, 'call_failed', 'Could not read the call status');
      }
    };

  return new Hono()
    .post(
      '/call-assist',
      // Every live call costs money and rings a real phone.
      rateLimit(startLimit, () => now().getTime()),
      zValidator('json', CallAssistRequestSchema, (result, c) => {
        if (!result.success) {
          return errorResponse(c, 400, 'invalid_body', validationMessage(result.error));
        }
      }),
      async (c) => {
        const req = c.req.valid('json');
        const today = format(now(), 'yyyy-MM-dd');
        const startedAt = now().getTime();

        if (!config || !takeLiveSlot(today)) {
          const callId = `sim-${randomUUID()}`;
          store.add(callId, {
            mode: 'simulated',
            startedAt,
            sim: createSimulatedCallTask(req, today, startedAt),
          });
          return c.json({ callId, mode: 'simulated' } satisfies CallAssistStartResponse);
        }

        try {
          const { id, attempt } = await dial(config, req, today, startedAt);
          store.add(id, {
            mode: 'live',
            startedAt,
            req,
            today,
            retry: req.retry ?? DEFAULT_CALL_RETRY,
            attempts: [attempt],
            nextAt: null,
            cancelledAt: null,
          });
          return c.json({ callId: id, mode: 'live' } satisfies CallAssistStartResponse);
        } catch (err) {
          console.error(err);
          return errorResponse(c, 502, 'call_failed', 'Could not start the call');
        }
      },
    )
    .get(
      '/call-assist/:callId',
      withTask(async (callId, task) => Response.json(await statusOf(callId, task))),
    )
    .post(
      '/call-assist/:callId/retry-now',
      withTask(async (callId, task) => {
        const nowMs = now().getTime();
        if (task.mode === 'simulated') {
          if (simulatedCallStatus(callId, task.sim, nowMs).status !== 'retry_scheduled') {
            return Response.json(
              { error: { code: 'not_waiting', message: 'No retry is scheduled' } },
              { status: 409 },
            );
          }
          task.sim = retrySimulatedCallNow(task.sim, nowMs);
        } else {
          if (task.nextAt === null || task.cancelledAt !== null) {
            return Response.json(
              { error: { code: 'not_waiting', message: 'No retry is scheduled' } },
              { status: 409 },
            );
          }
          task.nextAt = nowMs; // the refresh below dials right away
        }
        return Response.json(await statusOf(callId, task));
      }),
    )
    .post(
      '/call-assist/:callId/cancel',
      withTask(async (callId, task) => {
        const nowMs = now().getTime();
        if (task.mode === 'simulated') {
          task.sim = cancelSimulatedCall(task.sim, nowMs);
        } else {
          const current = await statusOf(callId, task);
          const finished = ['ended', 'failed', 'cancelled'].includes(current.status);
          // A live call already on the line is not hung up — only its retries are dropped.
          if (!finished) {
            task.cancelledAt = nowMs;
            task.nextAt = null;
          }
        }
        return Response.json(await statusOf(callId, task));
      }),
    );
}

/** Keeps live tasks moving (retries!) when no app is polling. Returns a stop function. */
export function startCallTicker(
  store: CallStore,
  config: CallAssistConfig | null,
  now: () => Date,
  everyMs: number,
): () => void {
  if (!config) return () => undefined;
  const timer = setInterval(() => {
    for (const [id, task] of store.activeLive()) {
      refreshLive(id, task, config, store, now().getTime()).catch((err: unknown) =>
        console.error(err),
      );
    }
  }, everyMs);
  timer.unref();
  return () => clearInterval(timer);
}

const WebhookSchema = z.object({
  message: z.object({
    type: z.string(),
    call: z.object({ id: z.string() }).optional(),
    role: z.string().optional(),
    transcript: z.string().optional(),
    transcriptType: z.string().optional(),
  }),
});

/** Vapi → us: live transcript lines. Mounted before the per-IP limiter (Vapi sends many). */
export function callAssistWebhookRoutes({
  store,
  secret,
}: {
  store: CallStore;
  secret: string | undefined;
}) {
  return new Hono().post('/call-assist/webhook', async (c) => {
    if (secret && c.req.header('x-vapi-secret') !== secret) {
      return errorResponse(c, 401, 'unauthorized', 'Bad webhook secret');
    }
    const parsed = WebhookSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return errorResponse(c, 400, 'invalid_body', 'Unexpected webhook body');

    const { type, call, role, transcript, transcriptType } = parsed.data.message;
    const task = call && store.get(call.id);
    const text = transcript?.trim();
    const providerId = call?.id;
    if (task?.mode === 'live' && type === 'transcript' && transcriptType === 'final' && text) {
      // Lines belong to the attempt with that provider id (normally the current one).
      const attempt =
        task.attempts.find((a) => a.vapiCallId === providerId || a.twilioSid === providerId) ??
        task.attempts.at(-1);
      attempt?.lines.push({ role: role === 'user' ? 'clinic' : 'agent', text });
    }
    return c.json({ ok: true });
  });
}
