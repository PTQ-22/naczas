import { describe, expect, it, vi } from 'vitest';

import { ApiErrorSchema, CoverageSchema } from '@naczas/shared';

import { createApp } from '../src/app';
import { createNfzClient } from '../src/nfz/client';
import { createSnapshotStore } from '../src/nfz/snapshot';
import { loadCoverageData, lookupCoverage, type CoverageData } from '../src/screening/data';
import { createUldkResolver, parseUldkTeryt } from '../src/screening/uldk';

const DATA: CoverageData = {
  asOf: '2026-10-01',
  pageUrl: 'https://www.nfz.gov.pl/x/',
  programs: {
    mammography: {
      source: 'https://www.nfz.gov.pl/x/mammografia.xlsx',
      country: [1000, 330],
      voivodeships: { '07': ['mazowieckie', 600, 200] },
      powiats: { '1465': ['Warszawa', 400, 125], '0201': ['powiat bolesławiecki', 5000, 1200] },
      // Small gmina: below MIN_GMINA_ELIGIBLE → its powiat is shown instead.
      gminas: { '020103': ['Gromadka', 900, 200], '020101': ['Bolesławiec', 9000, 2100] },
    },
  },
};

const uldkBody = (teryt: string) =>
  new Response(`0\n${teryt}|Gmina|powiat x|województwo\n`, { status: 200 });

function makeApp(uldk: typeof fetch) {
  const offline = vi.fn<typeof fetch>(() => Promise.reject(new Error('no network in tests')));
  return createApp({
    nfz: createNfzClient({ fetch: offline, minIntervalMs: 0, sleep: () => Promise.resolve() }),
    snapshot: createSnapshotStore('/nonexistent'),
    coverage: DATA,
    communes: createUldkResolver({ fetchImpl: uldk, timeoutMs: 50 }),
  });
}

async function get(app: ReturnType<typeof makeApp>, url: string) {
  const res = await app.request(url);
  return { status: res.status, body: await res.json() };
}

describe('GET /v1/coverage', () => {
  it('resolves coords to a gmina via ULDK and sends only rounded coords', async () => {
    const uldk = vi.fn<typeof fetch>(() => Promise.resolve(uldkBody('020101_1')));
    const { status, body } = await get(
      makeApp(uldk),
      '/v1/coverage?program=mammography&lat=51.26789&lng=15.56912',
    );
    expect(status).toBe(200);
    expect(CoverageSchema.parse(body)).toEqual({
      program: 'mammography',
      level: 'gmina',
      areaName: 'Bolesławiec',
      percent: 23.3,
      eligible: 9000,
      covered: 2100,
      asOf: '2026-10-01',
      source: 'https://www.nfz.gov.pl/x/mammografia.xlsx',
    });
    expect(uldk.mock.calls[0]?.[0]).toContain('xy=15.57,51.27,4326');
  });

  it('uses the powiat when the gmina is small or missing (Warsaw districts)', async () => {
    const small = await get(
      makeApp(() => Promise.resolve(uldkBody('020103_2'))),
      '/v1/coverage?program=mammography&lat=51.3&lng=15.4',
    );
    expect(small.body).toMatchObject({ level: 'powiat', areaName: 'powiat bolesławiecki' });
    const warsaw = await get(
      makeApp(() => Promise.resolve(uldkBody('146501_1'))),
      '/v1/coverage?program=mammography&lat=52.23&lng=21.01&province=07',
    );
    expect(warsaw.body).toMatchObject({ level: 'powiat', areaName: 'Warszawa', percent: 31.3 });
  });

  it('falls back to the province, then the country, when ULDK fails', async () => {
    const down = vi.fn<typeof fetch>(() => Promise.reject(new Error('timeout')));
    const app = makeApp(down);
    const province = await get(
      app,
      '/v1/coverage?program=mammography&lat=52.23&lng=21.01&province=07',
    );
    expect(province).toMatchObject({
      status: 200,
      body: { level: 'voivodeship', areaName: 'mazowieckie' },
    });
    const country = await get(app, '/v1/coverage?program=mammography');
    expect(country.body).toMatchObject({ level: 'country', areaName: 'Polska', percent: 33 });
  });

  it('rejects invalid queries with the error shape', async () => {
    const app = makeApp(() => Promise.resolve(uldkBody('020101_1')));
    for (const q of [
      'program=flu',
      'program=mammography&lat=52.2',
      'program=cervical&lat=x&lng=1',
    ]) {
      const { status, body } = await get(app, `/v1/coverage?${q}`);
      expect(status).toBe(400);
      expect(ApiErrorSchema.parse(body).error.code).toBe('invalid_query');
    }
    // Known program without data in this dataset
    const missing = await get(app, '/v1/coverage?program=cervical');
    expect(missing.status).toBe(404);
  });
});

describe('ULDK resolver', () => {
  it('parses TERYT and rejects errors', () => {
    expect(parseUldkTeryt('0\n146501_1|Warszawa (miasto)|powiat Warszawa|mazowieckie\n')).toBe(
      '1465011',
    );
    expect(parseUldkTeryt('-1 brak wyników')).toBeUndefined();
    expect(parseUldkTeryt('0\ngarbage')).toBeUndefined();
  });

  it('caches answers but not failures', async () => {
    const ok = vi.fn<typeof fetch>(() => Promise.resolve(uldkBody('020101_1')));
    const resolver = createUldkResolver({ fetchImpl: ok });
    await resolver.resolve(51.27, 15.57);
    expect(await resolver.resolve(51.27, 15.57)).toBe('0201011');
    expect(ok).toHaveBeenCalledTimes(1);

    const flaky = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(uldkBody('020101_1'));
    const r2 = createUldkResolver({ fetchImpl: flaky });
    expect(await r2.resolve(1, 1)).toBeUndefined();
    expect(await r2.resolve(1, 1)).toBe('0201011');
  });
});

describe('committed coverage data', () => {
  const data = loadCoverageData();

  it('has all three programmes with national totals matching NFZ', () => {
    // NFZ "RAZEM" row, 1.10.2026: 32.95% / 16.04% / 17.39%
    expect(lookupCoverage(data, 'mammography', {})?.percent).toBe(33);
    expect(lookupCoverage(data, 'cervical', {})?.percent).toBe(16);
    expect(lookupCoverage(data, 'colonoscopy', {})?.percent).toBe(17.4);
  });

  it('powiat and voivodeship figures are sums of their gminas', () => {
    const p = data.programs.mammography;
    if (!p) throw new Error('missing mammography');
    const sum = (prefix: string) =>
      Object.entries(p.gminas)
        .filter(([k]) => k.startsWith(prefix))
        .reduce<[number, number]>(([e0, c0], [, [, e, c]]) => [e0 + e, c0 + c], [0, 0]);
    expect(sum('0201')).toEqual(p.powiats['0201']?.slice(1));
    // Demo persona (Warsaw): districts are not gminas in ULDK → the city powiat answers.
    expect(lookupCoverage(data, 'mammography', { teryt: '1465011', province: '07' })).toMatchObject(
      { level: 'powiat', areaName: 'Warszawa' },
    );
  });
});
