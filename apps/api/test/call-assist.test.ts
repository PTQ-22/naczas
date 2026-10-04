import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  ApiErrorSchema,
  CallAssistStartResponseSchema,
  CallAssistStatusSchema,
  type CallAssistRequest,
} from '@naczas/shared';

import { createApp } from '../src/app';
import { buildAssistant } from '../src/call-assist/assistant';
import { buildReceptionist, RECEPTIONIST_PROMPT } from '../src/call-assist/receptionist';
import { createTwilioClient } from '../src/call-assist/twilio-client';
import { createVapiClient, type VapiCall } from '../src/call-assist/vapi-client';
import { loadEnv } from '../src/env';
import { createNfzClient } from '../src/nfz/client';
import { createSnapshotStore } from '../src/nfz/snapshot';
import { mapVapiStatus, vapiResult } from '../src/routes/call-assist';

beforeAll(() => {
  globalThis.fetch = () => Promise.reject(new Error('Real network access in tests'));
});

const body: CallAssistRequest = {
  examName: 'kolonoskopia',
  facilityName: 'Szpital Bielański',
  forWhom: 'mamę',
  callerName: 'Kasi',
};
const CALL_TO = '+48500600700';

function makeApp(vapiFetch?: typeof fetch, dailyLimit?: number) {
  let t = new Date('2026-10-04T10:00:00');
  const app = createApp({
    nfz: createNfzClient({ fetch: vi.fn<typeof fetch>(), minIntervalMs: 0 }),
    snapshot: createSnapshotStore('/nonexistent'),
    now: () => t,
    callAssist: vapiFetch
      ? {
          vapi: createVapiClient({ apiKey: 'test', fetch: vapiFetch }),
          via: 'vapi-number',
          phoneNumberId: 'pn_1',
          callTo: CALL_TO,
        }
      : null,
    callAssistWebhookSecret: 'shh',
    ...(dailyLimit !== undefined && { callAssistDailyLimit: dailyLimit }),
  });
  const advance = (ms: number) => (t = new Date(t.getTime() + ms));
  const post = (payload: unknown) =>
    app.request('/v1/call-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  return { app, advance, post };
}

const json = (data: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(data), { status }));

describe('POST /v1/call-assist', () => {
  it('rejects an invalid body', async () => {
    const res = await makeApp().post({ ...body, examName: '' });
    expect(res.status).toBe(400);
    expect(ApiErrorSchema.parse(await res.json()).error.code).toBe('invalid_body');
  });

  it('without Vapi config runs a scripted call that ends booked', async () => {
    const { app, advance, post } = makeApp();
    const start = CallAssistStartResponseSchema.parse(await (await post(body)).json());
    expect(start.mode).toBe('simulated');

    const ringing = CallAssistStatusSchema.parse(
      await (await app.request(`/v1/call-assist/${start.callId}`)).json(),
    );
    expect(ringing.status).toBe('ringing');

    advance(60_000);
    const ended = CallAssistStatusSchema.parse(
      await (await app.request(`/v1/call-assist/${start.callId}`)).json(),
    );
    expect(ended.status).toBe('ended');
    expect(ended.result).toEqual({ booked: true, date: '2026-10-19', time: '10:30', note: null });
    expect(ended.transcript[0]?.text).toBe('Rejestracja, słucham.');
    expect(ended.transcript[1]?.text).toContain('asystentem AI');
  });

  it('simulated: first attempt rings out, retry-now dials again, stats add up', async () => {
    const { app, advance, post } = makeApp();
    const { callId } = CallAssistStartResponseSchema.parse(await (await post(body)).json());
    const get = async (path = '') =>
      CallAssistStatusSchema.parse(
        await (await app.request(`/v1/call-assist/${callId}${path}`)).json(),
      );
    const postTo = (action: string) =>
      app.request(`/v1/call-assist/${callId}/${action}`, { method: 'POST' });

    // Not waiting yet → 409.
    expect((await postTo('retry-now')).status).toBe(409);
    advance(7000);
    const waiting = await get();
    expect(waiting).toMatchObject({ status: 'retry_scheduled', attempt: { number: 1, max: 3 } });
    expect(waiting.attempt?.nextAt).not.toBeNull();

    const redial = CallAssistStatusSchema.parse(await (await postTo('retry-now')).json());
    expect(redial).toMatchObject({ status: 'ringing', attempt: { number: 2 } });
    advance(60_000);
    const done = await get();
    expect(done).toMatchObject({
      status: 'ended',
      result: { booked: true },
      stats: { attempts: 2 },
    });
    expect(done.stats!.waitedSec).toBeGreaterThan(6);
    expect(done.stats!.talkedSec).toBeGreaterThan(15);
  });

  it('simulated: cancel stops the task', async () => {
    const { app, advance, post } = makeApp();
    const { callId } = CallAssistStartResponseSchema.parse(await (await post(body)).json());
    advance(7000);
    const res = await app.request(`/v1/call-assist/${callId}/cancel`, { method: 'POST' });
    expect(CallAssistStatusSchema.parse(await res.json()).status).toBe('cancelled');
    advance(120_000);
    const later = CallAssistStatusSchema.parse(
      await (await app.request(`/v1/call-assist/${callId}`)).json(),
    );
    expect(later.status).toBe('cancelled');
  });

  it('dials only the configured demo number, whatever the body says', async () => {
    const vapiFetch = vi.fn<typeof fetch>(() => json({ id: 'call_1', status: 'queued' }, 201));
    const { post } = makeApp(vapiFetch);
    const res = await post({ ...body, customer: { number: '+48111222333' } });
    expect(CallAssistStartResponseSchema.parse(await res.json())).toEqual({
      callId: 'call_1',
      mode: 'live',
    });
    const [url, init] = vapiFetch.mock.calls[0]!;
    expect(url).toBe('https://api.vapi.ai/call');
    const sent = JSON.parse(init!.body as string) as { customer: { number: string } };
    expect(sent.customer.number).toBe(CALL_TO);
  });

  it('falls back to the simulation once the daily live budget is spent', async () => {
    const vapiFetch = vi.fn<typeof fetch>(() => json({ id: 'call_1', status: 'queued' }, 201));
    const { post, advance } = makeApp(vapiFetch, 2);
    const modes = [];
    for (let i = 0; i < 3; i++) {
      modes.push(CallAssistStartResponseSchema.parse(await (await post(body)).json()).mode);
    }
    expect(modes).toEqual(['live', 'live', 'simulated']);
    expect(vapiFetch).toHaveBeenCalledTimes(2);

    advance(24 * 3600_000); // next day: budget renewed
    expect(CallAssistStartResponseSchema.parse(await (await post(body)).json()).mode).toBe('live');
  });

  it('maps a Vapi failure to 502', async () => {
    const { post } = makeApp(() => json({ message: 'bad phoneNumberId' }, 400));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await post(body);
    spy.mockRestore();
    expect(res.status).toBe(502);
  });

  it('limits starts to 5 per minute', async () => {
    const { post } = makeApp();
    for (let i = 0; i < 5; i++) expect((await post(body)).status).toBe(200);
    expect((await post(body)).status).toBe(429);
  });
});

describe('GET /v1/call-assist/:id (live)', () => {
  const endedCall = {
    id: 'call_1',
    status: 'ended',
    endedReason: 'assistant-ended-call',
    artifact: {
      messages: [
        { role: 'system', message: 'prompt' },
        { role: 'bot', message: 'Dzień dobry, jestem asystentem AI' },
        { role: 'user', message: 'Mam 18 października o 9:15' },
      ],
    },
    analysis: { structuredData: { booked: true, date: '2026-10-18', time: '09:15', note: '' } },
  };

  it('returns transcript and the extracted booking', async () => {
    let n = 0;
    const { app, post } = makeApp(() =>
      n++ === 0 ? json({ id: 'call_1', status: 'queued' }) : json(endedCall),
    );
    await post(body);
    const status = CallAssistStatusSchema.parse(
      await (await app.request('/v1/call-assist/call_1')).json(),
    );
    expect(status).toMatchObject({
      callId: 'call_1',
      status: 'ended',
      attempt: { number: 1, max: 3, nextAt: null },
      stats: { attempts: 1 },
      transcript: [
        { role: 'agent', text: 'Dzień dobry, jestem asystentem AI' },
        { role: 'clinic', text: 'Mam 18 października o 9:15' },
      ],
      result: { booked: true, date: '2026-10-18', time: '09:15', note: null },
    });
  });

  it('does not proxy calls this server did not start', async () => {
    const res = await makeApp(() => json(endedCall)).app.request('/v1/call-assist/other');
    expect(res.status).toBe(404);
  });

  it('collects live transcript lines from the webhook', async () => {
    let n = 0;
    const { app, post } = makeApp(() =>
      n++ === 0
        ? json({ id: 'call_1', status: 'queued' })
        : json({ id: 'call_1', status: 'in-progress' }),
    );
    await post(body);
    const hook = (secret: string) =>
      app.request('/v1/call-assist/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Vapi-Secret': secret },
        body: JSON.stringify({
          message: {
            type: 'transcript',
            transcriptType: 'final',
            role: 'user',
            transcript: 'Słucham?',
            call: { id: 'call_1' },
          },
        }),
      });
    expect((await hook('wrong')).status).toBe(401);
    expect((await hook('shh')).status).toBe(200);
    const status = CallAssistStatusSchema.parse(
      await (await app.request('/v1/call-assist/call_1')).json(),
    );
    expect(status.status).toBe('in_progress');
    expect(status.transcript).toEqual([{ role: 'clinic', text: 'Słucham?' }]);
  });
});

describe('Vapi mapping', () => {
  const call = (over: Partial<VapiCall>): VapiCall => ({ id: 'c', status: 'ended', ...over });

  it('treats no answer / busy as failed', () => {
    expect(mapVapiStatus(call({ endedReason: 'customer-did-not-answer' }))).toBe('failed');
    expect(mapVapiStatus(call({ endedReason: 'customer-busy' }))).toBe('failed');
    expect(mapVapiStatus(call({ endedReason: 'customer-ended-call' }))).toBe('ended');
    // Connected but nobody spoke yet: the agent is on hold.
    expect(mapVapiStatus(call({ status: 'in-progress' }))).toBe('on_hold');
    expect(
      mapVapiStatus(
        call({ status: 'in-progress', messages: [{ role: 'user', message: 'Rejestracja' }] }),
      ),
    ).toBe('in_progress');
  });

  it('drops malformed structured data', () => {
    expect(vapiResult(call({ analysis: { structuredData: { booked: 'yes' } } }))).toBeNull();
    expect(
      vapiResult(
        call({
          analysis: { structuredData: { booked: true, date: '18.10', time: '9:15', note: '' } },
        }),
      ),
    ).toEqual({ booked: true, date: null, time: null, note: null });
  });
});

describe('buildAssistant', () => {
  it('opens with the AI disclosure and speaks Polish', () => {
    const a = buildAssistant(body, '2026-10-04') as {
      firstMessage: string;
      transcriber: { language: string };
      server?: unknown;
    };
    expect(a.firstMessage).toMatch(/^Dzień dobry, jestem asystentem AI dzwoniącym w imieniu Kasi/);
    expect(a.transcriber.language).toBe('pl');
    expect(a.server).toBeUndefined();
  });

  it("gives the agent the patient's calendar as concrete windows, and nothing when none were given", () => {
    const prompt = (b: CallAssistRequest) =>
      (buildAssistant(b, '2026-10-04') as { model: { messages: { content: string }[] } }).model
        .messages[0]!.content;
    const withHours = prompt({
      ...body,
      availability: {
        weekly: [{ days: [1, 2, 3, 4, 5], from: '17:00', to: '20:00' }],
        dates: [{ date: '2026-10-21', from: '09:00', to: '12:00' }],
      },
    });
    // 04.10.2026 is a Sunday: the first window is Monday's.
    expect(withHours).toContain('- poniedziałek 5 października 17:00–20:00');
    expect(withHours).toContain('- środa 21 października 09:00–12:00');
    expect(withHours).toContain('Negocjacja terminu:');
    expect(withHours).toContain('zaproponuj konkretny termin z kalendarza');
    expect(prompt(body)).not.toContain('Kalendarz pacjenta');
    expect(prompt(body)).not.toContain('Negocjacja terminu');
  });

  it("tells the agent the hours the patient can't come, as a hard rule", () => {
    const a = buildAssistant(
      {
        ...body,
        availability: {
          weekly: [],
          dates: [],
          blocked: { weekly: [{ days: [3], from: '08:00', to: '12:00' }], dates: [] },
        },
      },
      '2026-10-04',
    ) as { model: { messages: { content: string }[] } };
    const content = a.model.messages[0]!.content;
    expect(content).toContain('NA PEWNO NIE MOŻE');
    expect(content).toContain('- w środy 08:00–12:00');
    expect(content).not.toContain('Kalendarz pacjenta');
    expect(content).toContain('odmów i poproś o inny');
  });

  it('caps the call length (shorter for agent-to-agent demos)', () => {
    expect(buildAssistant(body, '2026-10-04')).toMatchObject({ maxDurationSeconds: 180 });
    expect(buildAssistant(body, '2026-10-04', { maxDurationSeconds: 90 })).toMatchObject({
      maxDurationSeconds: 90,
    });
  });

  it('wires the webhook only with a public URL', () => {
    const a = buildAssistant(body, '2026-10-04', { publicUrl: 'https://x.ngrok.app/' });
    expect(a).toMatchObject({ server: { url: 'https://x.ngrok.app/v1/call-assist/webhook' } });
  });
});

describe('buildReceptionist', () => {
  it('is a short, separate demo agent that never asks for PESEL', () => {
    expect(buildReceptionist()).toMatchObject({
      maxDurationSeconds: 90,
      endCallFunctionEnabled: true,
      voice: { voiceId: 'pl-PL-MarekNeural' },
    });
    expect(RECEPTIONIST_PROMPT).toContain('Nie proś o PESEL');
    expect(RECEPTIONIST_PROMPT).toContain('Europe/Warsaw');
  });
});

describe('env', () => {
  it('validates the demo number and treats empty values as unset', () => {
    expect(() => loadEnv({ DEMO_CALL_TO: '500600700' })).toThrow(/DEMO_CALL_TO/);
    expect(loadEnv({ DEMO_CALL_TO: '', VAPI_API_KEY: '' }).DEMO_CALL_TO).toBeUndefined();
    expect(loadEnv({ DEMO_CALL_TO: CALL_TO }).DEMO_CALL_TO).toBe(CALL_TO);
  });

  it('dials a person by default; the receptionist agent only behind an explicit flag', () => {
    expect(loadEnv({}).CALL_TARGET).toBe('phone');
    expect(() => loadEnv({ CALL_TARGET: 'agent', VAPI_API_KEY: 'k' })).toThrow(
      /DEMO_RECEPTIONIST_TO/,
    );
    // No keys → simulation, nothing to dial: a blueprint with CALL_TARGET=agent still boots.
    expect(loadEnv({ CALL_TARGET: 'agent' }).CALL_TARGET).toBe('agent');
    expect(() => loadEnv({ CALL_TARGET: 'agent', DEMO_RECEPTIONIST_TO: '555' })).toThrow(/E\.164/);
    expect(() => loadEnv({ CALL_TARGET: 'robot' })).toThrow(/CALL_TARGET/);
    const env = loadEnv({ CALL_TARGET: 'agent', DEMO_RECEPTIONIST_TO: '+14155550123' });
    expect(env.DEMO_RECEPTIONIST_TO).toBe('+14155550123');
    expect(env.CALL_ASSIST_DAILY_LIMIT).toBe(20);
  });
});

const urlOf = (input: string | URL | Request) =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

describe('twilio-sip (verified caller ID → Vapi SIP)', () => {
  const SIP = 'sip:naczas-test@sip.vapi.ai';

  function makeSipApp(opts: { vapiCalls: () => unknown[]; twilioStatus: string }) {
    let t = new Date('2026-10-04T10:00:00Z');
    const advance = (ms: number) => (t = new Date(t.getTime() + ms));
    const vapiFetch = vi.fn<typeof fetch>((url, init) => {
      const u = urlOf(url);
      const method = init?.method ?? 'GET';
      if (u.endsWith('/assistant') && method === 'POST') return json({ id: 'asst_1' });
      if (u.endsWith('/phone-number') && method === 'GET') return json([]);
      if (u.endsWith('/phone-number') && method === 'POST') return json({ id: 'pn_sip' });
      if (u.includes('/phone-number/') && method === 'PATCH') return json({ id: 'pn_sip' });
      if (u.includes('/call?assistantId=asst_1')) return json(opts.vapiCalls());
      if (u.endsWith('/call/vapi_1'))
        return json({ id: 'vapi_1', status: 'in-progress', artifact: { messages: [] } });
      return json({ message: 'unexpected' }, 404);
    });
    const twilioFetch = vi.fn<typeof fetch>((_url, init) =>
      json({ sid: 'CA1', status: init?.method === 'POST' ? 'queued' : opts.twilioStatus }, 201),
    );
    const app = createApp({
      nfz: createNfzClient({ fetch: vi.fn<typeof fetch>(), minIntervalMs: 0 }),
      snapshot: createSnapshotStore('/nonexistent'),
      now: () => t,
      callAssist: {
        via: 'twilio-sip',
        vapi: createVapiClient({ apiKey: 'test', fetch: vapiFetch }),
        twilio: createTwilioClient({ accountSid: 'AC1', authToken: 't', fetch: twilioFetch }),
        from: '+48111222333',
        sipUri: SIP,
        callTo: CALL_TO,
      },
    });
    return { app, vapiFetch, twilioFetch, advance };
  }

  it('creates an assistant, points the SIP URI at it and has Twilio dial the demo number', async () => {
    const { app, vapiFetch, twilioFetch } = makeSipApp({
      vapiCalls: () => [],
      twilioStatus: 'ringing',
    });
    const res = await app.request('/v1/call-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(CallAssistStartResponseSchema.parse(await res.json())).toEqual({
      callId: 'CA1',
      mode: 'live',
    });

    const sipCreate = vapiFetch.mock.calls.find(
      ([u, i]) => urlOf(u).endsWith('/phone-number') && i?.method === 'POST',
    )!;
    expect(JSON.parse(sipCreate[1]!.body as string)).toEqual({
      provider: 'vapi',
      sipUri: SIP,
      assistantId: 'asst_1',
    });
    const form = new URLSearchParams(twilioFetch.mock.calls[0]![1]!.body as string);
    expect(form.get('From')).toBe('+48111222333');
    expect(form.get('To')).toBe(CALL_TO);
    expect(form.get('Twiml')).toBe(`<Response><Dial><Sip>${SIP}</Sip></Dial></Response>`);

    const ringing = CallAssistStatusSchema.parse(
      await (await app.request('/v1/call-assist/CA1')).json(),
    );
    expect(ringing.status).toBe('ringing');
  });

  it('switches to the Vapi call once the SIP leg reaches the assistant', async () => {
    let answered = false;
    const { app } = makeSipApp({
      vapiCalls: () => (answered ? [{ id: 'vapi_1', status: 'in-progress' }] : []),
      twilioStatus: 'ringing',
    });
    await app.request('/v1/call-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const ringing = CallAssistStatusSchema.parse(
      await (await app.request('/v1/call-assist/CA1')).json(),
    );
    expect(ringing.status).toBe('ringing');
    answered = true;
    const live = CallAssistStatusSchema.parse(
      await (await app.request('/v1/call-assist/CA1')).json(),
    );
    expect(live.status).toBe('on_hold'); // connected, the clinic hasn't spoken yet
  });

  it('nobody answers: schedules a retry in clinic hours and dials again when it is due', async () => {
    const { app, twilioFetch, advance } = makeSipApp({
      vapiCalls: () => [],
      twilioStatus: 'no-answer',
    });
    await app.request('/v1/call-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const missed = CallAssistStatusSchema.parse(
      await (await app.request('/v1/call-assist/CA1')).json(),
    );
    expect(missed).toMatchObject({ status: 'retry_scheduled', attempt: { number: 1, max: 3 } });
    // Sun 4.10 10:00 local → next opening is Mon 5.10 7:30 Polish time.
    expect(missed.attempt?.nextAt).toBe('2026-10-05T05:30:00.000Z');
    const dials = () => twilioFetch.mock.calls.filter(([, i]) => i?.method === 'POST').length;
    expect(dials()).toBe(1);

    advance(24 * 60 * 60_000);
    const second = CallAssistStatusSchema.parse(
      await (await app.request('/v1/call-assist/CA1')).json(),
    );
    expect(dials()).toBe(2);
    expect(second.attempt?.number).toBe(2);
  });
});
