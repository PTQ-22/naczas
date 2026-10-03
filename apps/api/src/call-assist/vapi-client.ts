import { z } from 'zod';

const VAPI_ORIGIN = 'https://api.vapi.ai';

export class VapiError extends Error {
  override name = 'VapiError';
}

/** Only the fields of Vapi's Call object we read; everything else is ignored. */
const VapiMessageSchema = z.object({
  role: z.string(),
  message: z.string().optional(),
});

export const VapiCallSchema = z.object({
  id: z.string(),
  status: z.string(),
  endedReason: z.string().nullish(),
  messages: z.array(VapiMessageSchema).nullish(),
  artifact: z.object({ messages: z.array(VapiMessageSchema).nullish() }).nullish(),
  analysis: z.object({ structuredData: z.unknown().optional() }).nullish(),
});
export type VapiCall = z.infer<typeof VapiCallSchema>;

export interface VapiClient {
  startCall(body: Record<string, unknown>): Promise<VapiCall>;
  getCall(id: string): Promise<VapiCall>;
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
  async function request(path: string, init: RequestInit = {}): Promise<VapiCall> {
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
    const parsed = VapiCallSchema.safeParse(await res.json());
    if (!parsed.success) throw new VapiError(`Unexpected Vapi response for ${path}`);
    return parsed.data;
  }

  return {
    startCall: (body) => request('/call', { method: 'POST', body: JSON.stringify(body) }),
    getCall: (id) => request(`/call/${encodeURIComponent(id)}`),
  };
}
