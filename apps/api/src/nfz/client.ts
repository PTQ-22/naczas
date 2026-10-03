import { type NfzQueue, NfzQueuesPageSchema } from './schemas';

const NFZ_ORIGIN = 'https://api.nfz.gov.pl';
const API_VERSION = '1.3';

/** NFZ did not give a usable answer (rate limit, network, timeout, changed format). */
export class NfzUnavailableError extends Error {
  override name = 'NfzUnavailableError';
}

export interface NfzClientOptions {
  fetch?: typeof fetch;
  /** Minimum gap between request starts. NFZ answers non-JSON after a few rapid requests. */
  minIntervalMs?: number;
  timeoutMs?: number;
  retries?: number;
  /** First retry delay; doubles on every next retry. */
  backoffMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export interface QueuesQuery {
  benefit: string;
  province: string;
  /** 1 = stable (default), 2 = urgent */
  case?: 1 | 2;
}

export interface NfzClient {
  getQueues(query: QueuesQuery): Promise<NfzQueue[]>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createNfzClient(options: NfzClientOptions = {}): NfzClient {
  const {
    fetch: fetchFn = globalThis.fetch,
    minIntervalMs = 1000,
    timeoutMs = 8000,
    retries = 3,
    backoffMs = 1000,
    sleep = defaultSleep,
  } = options;

  // Single global slot chain: every request (including retries and parallel callers) waits for
  // the previous one's start + minIntervalMs, so the whole process never bursts NFZ.
  let slot: Promise<void> = Promise.resolve();
  function nextSlot(): Promise<void> {
    const myTurn = slot;
    slot = myTurn.then(() => defaultSleep(minIntervalMs));
    return myTurn;
  }

  async function fetchJsonOnce(url: string): Promise<unknown> {
    await nextSlot();
    const res = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error('non-JSON response (NFZ rate limit)');
    }
  }

  async function fetchPage(url: string) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(backoffMs * 2 ** (attempt - 1));
      try {
        const parsed = NfzQueuesPageSchema.safeParse(await fetchJsonOnce(url));
        // A changed envelope won't fix itself on retry — fail fast so the caller can fall back.
        if (!parsed.success) throw new NfzUnavailableError(`Unexpected NFZ format: ${url}`);
        return parsed.data;
      } catch (err) {
        if (err instanceof NfzUnavailableError) throw err;
        lastError = err;
      }
    }
    throw new NfzUnavailableError(`NFZ unavailable after ${retries + 1} attempts: ${url}`, {
      cause: lastError,
    });
  }

  function withApiParams(url: URL): string {
    // `links.next` from NFZ drops api-version; keep every page on the same version.
    url.searchParams.set('format', 'json');
    url.searchParams.set('api-version', API_VERSION);
    return url.toString();
  }

  return {
    async getQueues({ benefit, province, case: queueCase = 1 }) {
      const first = new URL('/app-itl-api/queues', NFZ_ORIGIN);
      first.search = new URLSearchParams({
        case: String(queueCase),
        province,
        benefit,
        page: '1',
        limit: '25',
      }).toString();

      const records: NfzQueue[] = [];
      let url: string | null = withApiParams(first);
      while (url) {
        const page = await fetchPage(url);
        records.push(...page.data);
        const next = page.links?.next;
        url = next ? withApiParams(new URL(next, NFZ_ORIGIN)) : null;
      }
      return records;
    },
  };
}
