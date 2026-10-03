import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import { fixtureFetch, loadAllFixtures, rateLimitedResponse } from './helpers/nfz-fixtures';
import { buildSnapshotFromFixtures } from './helpers/snapshot-from-fixtures';
import { LruCache } from '../src/nfz/cache';
import { createNfzClient } from '../src/nfz/client';
import { createSnapshotStore } from '../src/nfz/snapshot';
import { createQueueLoader } from '../src/queues';

const SNAPSHOT_DIR = await buildSnapshotFromFixtures();
const HOUR = 60 * 60 * 1000;
const noWait = () => Promise.resolve();
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Controllable clock + NFZ that can be switched between fixtures and rate limiting. */
function setup() {
  let time = new Date('2026-10-04T10:00:00Z').getTime();
  let nfzUp = true;
  const fixtures = fixtureFetch(loadAllFixtures());
  const fetch = vi.fn<typeof globalThis.fetch>((input) =>
    nfzUp ? fixtures.fetch(input) : Promise.resolve(rateLimitedResponse()),
  );
  const loader = createQueueLoader({
    nfz: createNfzClient({ fetch, minIntervalMs: 0, sleep: noWait }),
    snapshot: createSnapshotStore(SNAPSHOT_DIR),
    now: () => new Date(time),
  });
  return {
    loader,
    fetch,
    advance: (ms: number) => (time += ms),
    setNfz: (up: boolean) => (nfzUp = up),
  };
}

const COLONOSCOPY = ['KOLONOSKOPIA'];

describe('LruCache', () => {
  it('evicts the least recently used entry', () => {
    const cache = new LruCache<number>(2, () => 0);
    cache.set('a', 1, 10);
    cache.set('b', 2, 10);
    cache.get('a'); // a becomes most recent
    cache.set('c', 3, 10);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')?.value).toBe(1);
    expect(cache.size).toBe(2);
  });

  it('reports freshness by TTL', () => {
    let now = 0;
    const cache = new LruCache<number>(10, () => now);
    cache.set('a', 1, 100);
    expect(cache.isFresh(cache.get('a')!)).toBe(true);
    now = 100;
    expect(cache.isFresh(cache.get('a')!)).toBe(false);
  });
});

describe('queue loader: cache → live → snapshot', () => {
  it('serves repeated requests from cache for 24 h', async () => {
    const { loader, fetch, advance } = setup();
    const first = await loader.load('07', COLONOSCOPY);
    const calls = fetch.mock.calls.length;
    expect(first.source).toBe('nfz_live');

    advance(23 * HOUR);
    await loader.load('07', COLONOSCOPY);
    expect(fetch.mock.calls.length).toBe(calls);
  });

  it('after 24 h serves the stale entry at once and refreshes it in the background once', async () => {
    const { loader, fetch, advance } = setup();
    await loader.load('07', COLONOSCOPY);
    const pagesPerFetch = fetch.mock.calls.length; // 4 pages
    advance(25 * HOUR);

    const [a, b] = await Promise.all([
      loader.load('07', COLONOSCOPY),
      loader.load('07', COLONOSCOPY),
    ]);
    expect(a.source).toBe('nfz_live');
    expect(b.queues).toHaveLength(a.queues.length);
    await vi.waitFor(() => expect(fetch.mock.calls.length).toBe(2 * pagesPerFetch));
  });

  it('falls back to the snapshot and does not hammer NFZ while it is down', async () => {
    const { loader, fetch, setNfz, advance } = setup();
    setNfz(false);
    const res = await loader.load('07', COLONOSCOPY);
    expect(res.source).toBe('nfz_snapshot');
    expect(loader.nfzStatus()).toBe('down');
    const attempts = fetch.mock.calls.length; // 1 + 3 retries

    advance(5 * 60 * 1000);
    await loader.load('07', COLONOSCOPY);
    expect(fetch.mock.calls.length).toBe(attempts); // within retryAfter (10 min)

    setNfz(true);
    advance(6 * 60 * 1000);
    expect((await loader.load('07', COLONOSCOPY)).source).toBe('nfz_snapshot'); // stale, served
    await vi.waitFor(async () =>
      expect((await loader.load('07', COLONOSCOPY)).source).toBe('nfz_live'),
    );
    expect(loader.nfzStatus()).toBe('up');
  });

  it('warm-up puts every snapshot entry in the cache; refresh replaces them with live data', async () => {
    const { loader, fetch } = setup();
    expect(await loader.warmUpFromSnapshot()).toBe(8); // 4 benefits × 2 provinces

    const warm = await loader.load('06', COLONOSCOPY);
    expect(warm.source).toBe('nfz_snapshot');
    await flush();

    await loader.refreshFromNfz([{ province: '07', benefit: 'KOLONOSKOPIA' }]);
    expect((await loader.load('07', COLONOSCOPY)).source).toBe('nfz_live');
    expect(fetch).toHaveBeenCalled();
  });
});

describe('endpoints with NFZ unreachable after warm-up', () => {
  it('answer from the snapshot in < 500 ms', async () => {
    // NFZ hangs (never answers) — the worst case for latency.
    const fetch = vi.fn<typeof globalThis.fetch>(() => new Promise<Response>(() => {}));
    const nfz = createNfzClient({ fetch });
    const snapshot = createSnapshotStore(SNAPSHOT_DIR);
    const loader = createQueueLoader({ nfz, snapshot, now: () => new Date() });
    await loader.warmUpFromSnapshot();
    const app = createApp({ nfz, snapshot, loader });

    for (const url of [
      '/v1/facilities?examId=dental_checkup&province=07&lat=52.23&lng=21.01',
      '/v1/wait-times?examId=dental_checkup&province=07&lat=52.23&lng=21.01',
      '/v1/wait-times?examId=colonoscopy_screening&province=06',
    ]) {
      const started = performance.now();
      const res = await app.request(url);
      const elapsed = performance.now() - started;
      expect(res.status).toBe(200);
      expect(((await res.json()) as { source: string }).source).toBe('nfz_snapshot');
      expect(elapsed).toBeLessThan(500);
    }
  });
});
