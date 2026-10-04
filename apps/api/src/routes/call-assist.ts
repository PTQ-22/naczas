import { randomUUID } from 'node:crypto';

import { zValidator } from '@hono/zod-validator';
import { format } from 'date-fns';
import { Hono } from 'hono';
import { z } from 'zod';

import {
  CallAssistRequestSchema,
  simulateCallAssist,
  type CallAssistRequest,
  type CallAssistResult,
  type CallAssistStartResponse,
  type CallAssistStatus,
  type ISODate,
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

interface CallEntry {
  mode: 'live' | 'simulated';
  startedAt: number;
  req: CallAssistRequest;
  today: ISODate;
  /** Live transcript pushed by the Vapi webhook (only when PUBLIC_URL is configured) */
  lines: Line[];
  vapiCallId?: string;
  /** twilio-sip: the per-call assistant (finds the Vapi call) and the Twilio leg */
  assistantId?: string;
  twilioSid?: string;
}

const TTL_MS = 60 * 60_000;

/**
 * In-memory registry of calls started by this instance. GET only answers for ids in here, so the
 * endpoint can't be used to read other calls on the Vapi account.
 */
export function createCallStore(now: () => number) {
  const calls = new Map<string, CallEntry>();
  return {
    add(id: string, entry: CallEntry) {
      for (const [key, e] of calls) if (now() - e.startedAt > TTL_MS) calls.delete(key);
      calls.set(id, entry);
    },
    get: (id: string) => calls.get(id),
    /** Same entry under the Vapi call id, so webhook events find it. */
    alias: (aliasId: string, entry: CallEntry) => calls.set(aliasId, entry),
  };
}
export type CallStore = ReturnType<typeof createCallStore>;

const FAILED_REASON = /did-not-answer|busy|voicemail|error|failed|fault/i;

export function mapVapiStatus(call: VapiCall): CallAssistStatus['status'] {
  switch (call.status) {
    case 'scheduled':
    case 'queued':
      return 'queued';
    case 'ringing':
      return 'ringing';
    case 'in-progress':
    case 'forwarding':
      return 'in_progress';
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

export function callAssistRoutes({
  config,
  store,
  now,
  startLimit,
}: {
  config: CallAssistConfig | null;
  store: CallStore;
  now: () => Date;
  startLimit: RateLimitOptions;
}) {
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

        if (!config) {
          const callId = `sim-${randomUUID()}`;
          store.add(callId, { mode: 'simulated', startedAt, req, today, lines: [] });
          return c.json({ callId, mode: 'simulated' } satisfies CallAssistStartResponse);
        }

        try {
          const assistant = buildAssistant(req, today, config.assistant);
          if (config.via === 'vapi-number') {
            const call = await config.vapi.startCall({
              phoneNumberId: config.phoneNumberId,
              customer: { number: config.callTo },
              assistant,
            });
            store.add(call.id, {
              mode: 'live',
              startedAt,
              req,
              today,
              lines: [],
              vapiCallId: call.id,
            });
            return c.json({ callId: call.id, mode: 'live' } satisfies CallAssistStartResponse);
          }
          // One assistant per call: the SIP URI answers with it, and it lets us find the call.
          const { id: assistantId } = await config.vapi.createAssistant(assistant);
          await config.vapi.routeSipUri(config.sipUri, assistantId);
          const tw = await config.twilio.startCall({
            from: config.from,
            to: config.callTo,
            twiml: sipBridgeTwiml(config.sipUri),
          });
          store.add(tw.sid, {
            mode: 'live',
            startedAt,
            req,
            today,
            lines: [],
            assistantId,
            twilioSid: tw.sid,
          });
          return c.json({ callId: tw.sid, mode: 'live' } satisfies CallAssistStartResponse);
        } catch (err) {
          console.error(err);
          return errorResponse(c, 502, 'call_failed', 'Could not start the call');
        }
      },
    )
    .get('/call-assist/:callId', async (c) => {
      const callId = c.req.param('callId');
      const entry = store.get(callId);
      if (!entry) return errorResponse(c, 404, 'unknown_call', 'Unknown call id');

      if (entry.mode === 'simulated') {
        const elapsed = now().getTime() - entry.startedAt;
        return c.json(simulateCallAssist(callId, entry.req, entry.today, elapsed));
      }

      let call: VapiCall;
      try {
        const cfg = config!;
        if (!entry.vapiCallId && cfg.via === 'twilio-sip' && entry.assistantId) {
          const [found] = await cfg.vapi.listCallsByAssistant(entry.assistantId);
          if (found) {
            entry.vapiCallId = found.id;
            store.alias(found.id, entry);
          } else {
            // Not answered yet (or never): report the phone leg.
            const tw = await cfg.twilio.getCall(entry.twilioSid!);
            const status = mapTwilioStatus(tw.status);
            return c.json({
              callId,
              status: status === 'in_progress' ? 'ringing' : status, // answered, SIP connecting
              transcript: [],
              result: null,
            } satisfies CallAssistStatus);
          }
        }
        call = await cfg.vapi.getCall(entry.vapiCallId ?? callId);
      } catch (err) {
        console.error(err);
        return errorResponse(c, 502, 'call_failed', 'Could not read the call status');
      }
      const result = vapiResult(call);
      const body: CallAssistStatus = {
        callId,
        // A booked result wins over a scary endedReason (e.g. the clinic hung up first).
        status: result?.booked ? 'ended' : mapVapiStatus(call),
        // Webhook lines arrive live; after the call Vapi's own artifact is complete and cleaner.
        transcript:
          call.status === 'ended' || entry.lines.length === 0 ? vapiTranscript(call) : entry.lines,
        result,
      };
      return c.json(body);
    });
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
    const entry = call && store.get(call.id);
    const text = transcript?.trim();
    if (entry && type === 'transcript' && transcriptType === 'final' && text) {
      entry.lines.push({ role: role === 'user' ? 'clinic' : 'agent', text });
    }
    return c.json({ ok: true });
  });
}
