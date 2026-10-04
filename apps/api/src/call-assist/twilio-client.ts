import { z } from 'zod';

export class TwilioError extends Error {
  override name = 'TwilioError';
}

const TwilioCallSchema = z.object({ sid: z.string(), status: z.string() });
export type TwilioCall = z.infer<typeof TwilioCallSchema>;

export interface TwilioClient {
  startCall(params: { from: string; to: string; twiml: string }): Promise<TwilioCall>;
  getCall(sid: string): Promise<TwilioCall>;
}

export interface TwilioClientOptions {
  accountSid: string;
  authToken: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

/** Minimal Twilio REST client (Calls only) — no SDK dependency for two endpoints. */
export function createTwilioClient({
  accountSid,
  authToken,
  fetch: fetchFn = globalThis.fetch,
  timeoutMs = 10_000,
}: TwilioClientOptions): TwilioClient {
  const base = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls`;
  const auth = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

  async function request(url: string, init: RequestInit = {}) {
    const res = await fetchFn(url, {
      ...init,
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new TwilioError(`Twilio ${init.method ?? 'GET'} Calls: HTTP ${res.status} ${detail}`);
    }
    const parsed = TwilioCallSchema.safeParse(await res.json());
    if (!parsed.success) throw new TwilioError('Unexpected Twilio response');
    return parsed.data;
  }

  return {
    startCall: ({ from, to, twiml }) =>
      request(`${base}.json`, {
        method: 'POST',
        body: new URLSearchParams({ From: from, To: to, Twiml: twiml }).toString(),
      }),
    getCall: (sid) => request(`${base}/${encodeURIComponent(sid)}.json`),
  };
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** When the callee answers, Twilio bridges the call to the Vapi assistant over SIP. */
export function sipBridgeTwiml(sipUri: string): string {
  return `<Response><Dial><Sip>${escapeXml(sipUri)}</Sip></Dial></Response>`;
}
