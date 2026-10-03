import { LruCache } from './nfz/cache';
import { NfzUnavailableError, type NfzClient } from './nfz/client';

import type { NfzQueue } from './nfz/schemas';
import type { SnapshotEntry, SnapshotStore } from './nfz/snapshot';

export type DataSource = 'nfz_live' | 'nfz_snapshot';

export interface LoadedQueues {
  queues: NfzQueue[];
  source: DataSource;
  /** 'YYYY-MM' — month of the data when a record has no statistics.update */
  fallbackMonth: string;
}

/** Neither cache, live NFZ nor the snapshot could serve the request. */
export class DataUnavailableError extends Error {
  override name = 'DataUnavailableError';
}

interface QueueEntry {
  queues: NfzQueue[];
  source: DataSource;
  fetchedAt: string; // ISO
}

const HOUR = 60 * 60 * 1000;

export interface QueueLoaderOptions {
  nfz: NfzClient;
  snapshot: SnapshotStore;
  now: () => Date;
  /** Live data stays fresh this long (brief: 24 h). */
  liveTtlMs?: number;
  /** After a failed live call, wait this long before trying NFZ again for the same key. */
  retryAfterMs?: number;
  maxEntries?: number;
  onBackgroundError?: (err: unknown) => void;
}

export interface QueueLoader {
  load(province: string, benefits: readonly string[]): Promise<LoadedQueues>;
  /** Puts every snapshot entry into the cache as stale; returns how many. */
  warmUpFromSnapshot(): Promise<number>;
  /** Refreshes the given keys from NFZ one after another (startup background job). */
  refreshFromNfz(keys: ReadonlyArray<{ province: string; benefit: string }>): Promise<void>;
  /** Result of the most recent live NFZ call ('up' until a call fails). */
  nfzStatus(): 'up' | 'down';
}

const cacheKey = (benefit: string, province: string, queueCase = 1) =>
  `${benefit}|${province}|${queueCase}`;

/**
 * Order: cache → live NFZ → snapshot. A stale cache entry is served immediately and refreshed
 * in the background, so a request never waits for NFZ when any data exists (NFZ pages are
 * throttled to ~1/s: dental care in one province is ~30 s live).
 */
export function createQueueLoader(options: QueueLoaderOptions): QueueLoader {
  const {
    nfz,
    snapshot,
    now,
    liveTtlMs = 24 * HOUR,
    retryAfterMs = HOUR / 6,
    maxEntries = 500,
    onBackgroundError = (err) => console.error('Background NFZ refresh failed', err),
  } = options;
  const cache = new LruCache<QueueEntry>(maxEntries, () => now().getTime());
  const inFlight = new Map<string, Promise<QueueEntry>>();
  let lastLiveOk = true;

  /** One live fetch per key at a time; concurrent callers share it. */
  function fetchLive(province: string, benefit: string): Promise<QueueEntry> {
    const key = cacheKey(benefit, province);
    const running = inFlight.get(key);
    if (running) return running;
    const promise = nfz
      .getQueues({ benefit, province })
      .then((queues) => {
        lastLiveOk = true;
        const entry: QueueEntry = { queues, source: 'nfz_live', fetchedAt: now().toISOString() };
        cache.set(key, entry, liveTtlMs);
        return entry;
      })
      .catch((err: unknown) => {
        if (err instanceof NfzUnavailableError) lastLiveOk = false;
        throw err;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  function refreshInBackground(province: string, benefit: string, stale: QueueEntry) {
    if (inFlight.has(cacheKey(benefit, province))) return;
    fetchLive(province, benefit).catch((err: unknown) => {
      // Keep serving what we have; don't retry NFZ for this key until retryAfterMs.
      cache.set(cacheKey(benefit, province), stale, retryAfterMs);
      if (!(err instanceof NfzUnavailableError)) onBackgroundError(err);
    });
  }

  const fromSnapshot = (e: SnapshotEntry): QueueEntry => ({
    queues: e.queues,
    source: 'nfz_snapshot',
    fetchedAt: e.fetchedAt,
  });

  async function getEntry(province: string, benefit: string): Promise<QueueEntry> {
    const key = cacheKey(benefit, province);
    const cached = cache.get(key);
    if (cached) {
      if (!cache.isFresh(cached)) refreshInBackground(province, benefit, cached.value);
      return cached.value;
    }
    try {
      return await fetchLive(province, benefit);
    } catch (err) {
      if (!(err instanceof NfzUnavailableError)) throw err;
      const snap = await snapshot.read(province, benefit);
      if (!snap) throw new DataUnavailableError(`No NFZ data and no snapshot: ${key}`);
      const entry = fromSnapshot(snap);
      cache.set(key, entry, retryAfterMs);
      return entry;
    }
  }

  return {
    async load(province, benefits) {
      const entries = await Promise.all(benefits.map((b) => getEntry(province, b)));
      const oldest = entries.map((e) => e.fetchedAt).sort()[0] ?? now().toISOString();
      return {
        queues: entries.flatMap((e) => e.queues),
        // Any snapshot part makes the whole answer "snapshot" — the UI shows a data-age hint.
        source: entries.some((e) => e.source === 'nfz_snapshot') ? 'nfz_snapshot' : 'nfz_live',
        fallbackMonth: oldest.slice(0, 7),
      };
    },

    async warmUpFromSnapshot() {
      const entries = await snapshot.readAll();
      for (const e of entries) {
        // ttl 0 = stale at once: served immediately, refreshed from NFZ on first use/refresh job
        cache.set(cacheKey(e.benefit, e.province), fromSnapshot(e), 0);
      }
      return entries.length;
    },

    async refreshFromNfz(keys) {
      // Sequential on purpose: user-triggered fetches interleave instead of queueing behind
      // hundreds of background pages in the NFZ client's throttle.
      for (const { province, benefit } of keys) {
        try {
          await fetchLive(province, benefit);
        } catch (err) {
          if (!(err instanceof NfzUnavailableError)) onBackgroundError(err);
        }
      }
    },

    nfzStatus: () => (lastLiveOk ? 'up' : 'down'),
  };
}
