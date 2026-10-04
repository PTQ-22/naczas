import { describe, expect, it, vi } from 'vitest';

import {
  fixtureFetch,
  jsonResponse,
  loadFixture,
  rateLimitedResponse,
} from './helpers/nfz-fixtures';
import { createNfzClient, NfzUnavailableError, resolveNfzLink } from '../src/nfz/client';

const colonoscopy07 = loadFixture('07', 'kolonoskopia');
const noWait = () => Promise.resolve();

describe('NFZ client', () => {
  it('follows links.next and merges all pages', async () => {
    const { fetch, calls } = fixtureFetch([colonoscopy07]);
    const client = createNfzClient({ fetch, minIntervalMs: 0, sleep: noWait });

    const queues = await client.getQueues({ benefit: 'KOLONOSKOPIA', province: '07' });

    expect(queues).toHaveLength(98);
    expect(calls).toHaveLength(4);
    // Every page, including the ones built from links.next, stays on the same API version,
    // adult filter and v1.4 base path (links.next lacks the /app-itl-api-pcus prefix).
    for (const call of calls) {
      const u = new URL(call);
      expect(u.origin + u.pathname).toBe('https://apinfz.nfz.gov.pl/app-itl-api-pcus/queues');
      expect(u.searchParams.get('api-version')).toBe('1.4');
      expect(u.searchParams.get('benefitForAdultsChildren')).toBe('2');
    }
    expect(new URL(calls[0]!).searchParams.get('case')).toBe('1');
    expect(calls.map((c) => new URL(c).searchParams.get('page'))).toEqual(['1', '2', '3', '4']);
  });

  it('uses a configured base URL and API version', async () => {
    const { fetch, calls } = fixtureFetch([colonoscopy07]);
    const client = createNfzClient({
      fetch,
      baseUrl: 'https://api.nfz.gov.pl/app-itl-api',
      apiVersion: '1.3',
      minIntervalMs: 0,
      sleep: noWait,
    });

    await client.getQueues({ benefit: 'KOLONOSKOPIA', province: '07' });

    const u = new URL(calls[0]!);
    expect(u.origin + u.pathname).toBe('https://api.nfz.gov.pl/app-itl-api/queues');
    expect(u.searchParams.get('api-version')).toBe('1.3');
  });

  it.each([
    ['/queues?page=2', 'https://apinfz.nfz.gov.pl/app-itl-api-pcus/queues?page=2'],
    ['queues?page=2', 'https://apinfz.nfz.gov.pl/app-itl-api-pcus/queues?page=2'],
    ['/app-itl-api-pcus/queues?page=2', 'https://apinfz.nfz.gov.pl/app-itl-api-pcus/queues?page=2'],
    ['https://example.org/queues?page=2', 'https://example.org/queues?page=2'],
  ])('resolves NFZ link %s against the base path', (link, expected) => {
    expect(resolveNfzLink(link, 'https://apinfz.nfz.gov.pl/app-itl-api-pcus').toString()).toBe(
      expected,
    );
  });

  it('parses records tolerantly (unknown fields, empty statistics)', async () => {
    const page = {
      links: { next: null },
      data: [
        {
          id: 'q1',
          type: 'queue',
          attributes: { benefit: 'KOLONOSKOPIA', statistics: {}, 'new-nfz-field': 42 },
        },
      ],
    };
    const client = createNfzClient({
      fetch: () => Promise.resolve(jsonResponse(page)),
      minIntervalMs: 0,
      sleep: noWait,
    });

    const [queue] = await client.getQueues({ benefit: 'KOLONOSKOPIA', province: '07' });

    expect(queue?.id).toBe('q1');
    expect(queue?.attributes.statistics?.['provider-data']).toBeUndefined();
  });

  it('retries a rate-limited (non-JSON) answer with exponential backoff', async () => {
    const page = loadFixture('06', 'kolonoskopia').pages[1]!; // last page: next = null
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(rateLimitedResponse())
      .mockResolvedValueOnce(rateLimitedResponse())
      .mockResolvedValueOnce(jsonResponse(page));
    const sleep = vi.fn((_ms: number) => Promise.resolve());
    const client = createNfzClient({ fetch, minIntervalMs: 0, sleep, backoffMs: 100 });

    const queues = await client.getQueues({ benefit: 'KOLONOSKOPIA', province: '06' });

    expect(queues).toHaveLength(page.data.length);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200]);
  });

  it('gives up after 3 retries with NfzUnavailableError (caller falls back to snapshot)', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(rateLimitedResponse()));
    const client = createNfzClient({ fetch, minIntervalMs: 0, sleep: noWait });

    await expect(client.getQueues({ benefit: 'KOLONOSKOPIA', province: '07' })).rejects.toThrow(
      NfzUnavailableError,
    );
    expect(fetch).toHaveBeenCalledTimes(4); // first attempt + 3 retries
  });

  it('treats network errors and HTTP errors as retryable', async () => {
    const page = loadFixture('06', 'kolonoskopia').pages[1]!;
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(jsonResponse(page));
    const client = createNfzClient({ fetch, minIntervalMs: 0, sleep: noWait });

    await expect(
      client.getQueues({ benefit: 'KOLONOSKOPIA', province: '06' }),
    ).resolves.toHaveLength(page.data.length);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('rejects a response whose shape changed (no data array)', async () => {
    const client = createNfzClient({
      fetch: () => Promise.resolve(jsonResponse({ errors: ['nope'] })),
      minIntervalMs: 0,
      sleep: noWait,
    });

    await expect(client.getQueues({ benefit: 'KOLONOSKOPIA', province: '07' })).rejects.toThrow(
      NfzUnavailableError,
    );
  });

  it('spaces requests by at least minIntervalMs, also across parallel callers', async () => {
    const started: number[] = [];
    const fetch = vi.fn<typeof globalThis.fetch>(() => {
      started.push(Date.now());
      return Promise.resolve(jsonResponse({ links: { next: null }, data: [] }));
    });
    const client = createNfzClient({ fetch, minIntervalMs: 40, sleep: noWait });

    await Promise.all([
      client.getQueues({ benefit: 'A', province: '06' }),
      client.getQueues({ benefit: 'B', province: '06' }),
      client.getQueues({ benefit: 'C', province: '06' }),
    ]);

    const gaps = started.slice(1).map((t, i) => t - started[i]!);
    expect(gaps).toHaveLength(2);
    // small tolerance for timer granularity
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(35);
  });
});
