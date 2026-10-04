import { z } from 'zod';

const VAPI_ORIGIN = 'https://api.vapi.ai';

export class VapiError extends Error {
  override name = 'VapiError';
}

/** Only the fields of Vapi's Call object we read; everything else is ignored. */
const VapiMessageSchema = z.object({
  role: z.string(),
  message: z.string().optional(),
  /** Seconds since the call started — the first clinic line ends the "on hold" part */
  secondsFromStart: z.number().nullish(),
});

export const VapiCallSchema = z.object({
  id: z.string(),
  status: z.string(),
  endedReason: z.string().nullish(),
  startedAt: z.string().nullish(),
  endedAt: z.string().nullish(),
  messages: z.array(VapiMessageSchema).nullish(),
  artifact: z.object({ messages: z.array(VapiMessageSchema).nullish() }).nullish(),
  analysis: z.object({ structuredData: z.unknown().optional() }).nullish(),
});
export type VapiCall = z.infer<typeof VapiCallSchema>;

const IdSchema = z.object({ id: z.string() });
const SipNumberSchema = z.object({
  id: z.string(),
  provider: z.string().optional(),
  sipUri: z.string().nullish(),
});

export interface VapiClient {
  startCall(body: Record<string, unknown>): Promise<VapiCall>;
  getCall(id: string): Promise<VapiCall>;
  /** Calls handled by one assistant, newest first (we create one assistant per SIP call). */
  listCallsByAssistant(assistantId: string): Promise<VapiCall[]>;
  createAssistant(assistant: Record<string, unknown>): Promise<{ id: string }>;
  /** Free Vapi SIP URI pointed at `assistantId` — created on first use, re-pointed afterwards. */
  routeSipUri(sipUri: string, assistantId: string): Promise<void>;
}

export interface VapiClientOptions {
  apiKey: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function createVapiClient({
  apiKey,
  fetch: fetchFn = globalThis.fetch,
  timeoutMs = 10_000,
}: VapiClientOptions): VapiClient {
  async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
    const res = await fetchFn(`${VAPI_ORIGIN}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      // Vapi's error body explains misconfiguration (bad phone number id, voice…) — keep it for
      // the server log; it never contains the dialled number.
      const detail = (await res.text()).slice(0, 500);
      throw new VapiError(`Vapi ${init.method ?? 'GET'} ${path}: HTTP ${res.status} ${detail}`);
    }
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) throw new VapiError(`Unexpected Vapi response for ${path}`);
    return parsed.data;
  }
  const json = (method: string, body: unknown): RequestInit => ({
    method,
    body: JSON.stringify(body),
  });

  let sipNumberId: string | undefined;

  return {
    startCall: (body) => request('/call', VapiCallSchema, json('POST', body)),
    getCall: (id) => request(`/call/${encodeURIComponent(id)}`, VapiCallSchema),
    listCallsByAssistant: (assistantId) =>
      request(
        `/call?assistantId=${encodeURIComponent(assistantId)}&limit=5`,
        z.array(VapiCallSchema),
      ),
    createAssistant: (assistant) => request('/assistant', IdSchema, json('POST', assistant)),
    async routeSipUri(sipUri, assistantId) {
      if (!sipNumberId) {
        const numbers = await request('/phone-number', z.array(SipNumberSchema));
        sipNumberId = numbers.find((n) => n.sipUri === sipUri)?.id;
      }
      if (sipNumberId) {
        await request(`/phone-number/${sipNumberId}`, IdSchema, json('PATCH', { assistantId }));
        return;
      }
      const created = await request(
        '/phone-number',
        IdSchema,
        json('POST', { provider: 'vapi', sipUri, assistantId }),
      );
      sipNumberId = created.id;
    },
  };
}
