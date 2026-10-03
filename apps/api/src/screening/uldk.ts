/**
 * GUGiK ULDK: coordinates → gmina TERYT. Public, keyless, but slow at times — so a short timeout,
 * an in-memory cache keyed by the already-rounded (~1 km) coordinates, and callers fall back to
 * the province when it fails. Never logs coordinates (AGENTS.md §8).
 */
export const ULDK_URL = 'https://uldk.gugik.gov.pl/';

export interface CommuneResolver {
  /** 7-digit TERYT (e.g. '1465011'), or undefined when unknown / outside Poland / ULDK down. */
  resolve: (lat: number, lng: number) => Promise<string | undefined>;
}

export interface UldkOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxEntries?: number;
}

/** Body: "0\n146501_1|Warszawa (miasto)|powiat Warszawa|mazowieckie"; errors start with "-1". */
export function parseUldkTeryt(body: string): string | undefined {
  const [status, first] = body.trim().split('\n');
  if (status?.trim() !== '0' || !first) return undefined;
  const teryt = first.split('|')[0]?.replace('_', '') ?? '';
  return /^\d{7}$/.test(teryt) ? teryt : undefined;
}

export function createUldkResolver({
  fetchImpl = (...args) => fetch(...args),
  timeoutMs = 3000,
  maxEntries = 5000,
}: UldkOptions = {}): CommuneResolver {
  const cache = new Map<string, string | undefined>();
  return {
    async resolve(lat, lng) {
      const key = `${lat},${lng}`;
      if (cache.has(key)) return cache.get(key);
      const url =
        `${ULDK_URL}?request=GetCommuneByXY&xy=${lng},${lat},4326` +
        '&result=teryt,commune,county,voivodeship';
      let teryt: string | undefined;
      try {
        const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!res.ok) return undefined; // transient: don't cache
        teryt = parseUldkTeryt(await res.text());
      } catch {
        return undefined; // timeout / network: don't cache, the province fallback still answers
      }
      if (cache.size >= maxEntries) cache.delete(cache.keys().next().value ?? '');
      cache.set(key, teryt); // "outside Poland" is a stable answer too
      return teryt;
    },
  };
}
