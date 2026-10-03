import { type NfzQueue, NfzQueuesPageSchema } from './schemas';

/**
 * ITL v1.4 ("app-itl-api-pcus") adds `dates.pcus` — a daily forecast of the waiting time.
 * v1.3 (api.nfz.gov.pl/app-itl-api) only has the monthly average-period. v1.4 answers
 * api-version=1.3 with UnsupportedApiVersion, so base URL and version must be changed together.
 */
export const NFZ_DEFAULT_BASE_URL = 'https://apinfz.nfz.gov.pl/app-itl-api-pcus';
export const NFZ_API_VERSION = '1.4';

/** NFZ `benefitForAdultsChildren`: 1 = all, 2 = adults, 3 = children (v1.4) */
const FOR_ADULTS = '2';

/**
 * Resolves an NFZ `links.*` value. v1.4 returns `/queues?page=2…` WITHOUT the
 * `/app-itl-api-pcus` prefix, so a root-relative link must be resolved against the base path,
 * not the origin. Absolute or already-prefixed links are kept as they are.
 */
export function resolveNfzLink(link: string, baseUrl: string): URL {
  const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (/^https?:\/\//i.test(link) || link.startsWith(base.pathname)) return new URL(link, base);
  return new URL(link.replace(/^\/+/, ''), base);
}

/** NFZ did not give a usable answer (rate limit, network, timeout, changed format). */
export class NfzUnavailableError extends Error {
  override name = 'NfzUnavailableError';
}

export interface NfzClientOptions {
  fetch?: typeof fetch;
  /** ITL API root, e.g. https://apinfz.nfz.gov.pl/app-itl-api-pcus */
  baseUrl?: string;
  apiVersion?: string;
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
    baseUrl = NFZ_DEFAULT_BASE_URL,
    apiVersion = NFZ_API_VERSION,
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
    // `links.next` from NFZ drops api-version and benefitForAdultsChildren; keep every page on
    // the same version and filter.
    url.searchParams.set('format', 'json');
    url.searchParams.set('api-version', apiVersion);
    // Server-side adult filter; normalize.ts keeps the place-name check as a fallback.
    url.searchParams.set('benefitForAdultsChildren', FOR_ADULTS);
    return url.toString();
  }

  return {
    async getQueues({ benefit, province, case: queueCase = 1 }) {
      const first = resolveNfzLink('queues', baseUrl);
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
        url = next ? withApiParams(resolveNfzLink(next, baseUrl)) : null;
      }
      return records;
    },
  };
}
