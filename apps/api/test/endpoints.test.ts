import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  ApiErrorSchema,
  FacilitiesResponseSchema,
  HealthResponseSchema,
  WaitTimeSummarySchema,
} from '@naczas/shared';

import { createApp } from '../src/app';
import { fixtureFetch, loadAllFixtures, rateLimitedResponse } from './helpers/nfz-fixtures';
import { buildSnapshotFromFixtures } from './helpers/snapshot-from-fixtures';
import { createNfzClient } from '../src/nfz/client';
import { GEO_INDEX_FILE, loadGeoIndex } from '../src/nfz/geo-index';
import { createSnapshotStore } from '../src/nfz/snapshot';

// Expected numbers computed independently (Python) from the recorded fixtures,
// for coordinates already rounded to 2 decimals (the server rounds too).
const WARSAW = 'lat=52.23&lng=21.01';
const FIXTURES_AS_SNAPSHOT = await buildSnapshotFromFixtures();
const noWait = () => Promise.resolve();
const now = () => new Date('2026-10-04T10:00:00Z');
const geoIndex = loadGeoIndex(GEO_INDEX_FILE);

function makeApp(nfz: 'up' | 'down', snapshotDir = FIXTURES_AS_SNAPSHOT) {
  const fetch =
    nfz === 'up'
      ? fixtureFetch(loadAllFixtures()).fetch
      : vi.fn<typeof globalThis.fetch>(() => Promise.resolve(rateLimitedResponse()));
  return createApp({
    nfz: createNfzClient({ fetch, minIntervalMs: 0, sleep: noWait }),
    snapshot: createSnapshotStore(snapshotDir),
    now,
    geoIndex,
  });
}

async function get(app: ReturnType<typeof makeApp>, url: string) {
  const res = await app.request(url);
  return { status: res.status, body: await res.json() };
}

// Guard: these tests must never reach the real NFZ.
const realFetch = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = () => Promise.reject(new Error('Real network access in tests'));
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('GET /v1/health', () => {
  it('reports ok, NFZ status and snapshot date', async () => {
    const { status, body } = await get(makeApp('up'), '/v1/health');
    expect(status).toBe(200);
    expect(HealthResponseSchema.parse(body)).toEqual({
      ok: true,
      nfz: 'up',
      snapshotAsOf: '2026-10-03',
    });
  });

  it('reports nfz: down after a failed live call and "none" without a snapshot', async () => {
    const app = makeApp('down', '/nonexistent');
    await get(app, `/v1/wait-times?examId=colonoscopy_screening&province=07`);
    const { body } = await get(app, '/v1/health');
    expect(body).toEqual({ ok: true, nfz: 'down', snapshotAsOf: 'none' });
  });
});

describe('GET /v1/wait-times', () => {
  const url = `/v1/wait-times?examId=colonoscopy_screening&province=07&${WARSAW}&radiusKm=15`;

  it('aggregates live NFZ data around the user', async () => {
    const { status, body } = await get(makeApp('up'), url);
    expect(status).toBe(200);
    expect(WaitTimeSummarySchema.parse(body)).toEqual({
      examId: 'colonoscopy_screening',
      province: '07',
      radiusKm: 15,
      facilitiesCount: 36,
      p50Days: 138,
      p75Days: 187,
      minDays: 17,
      asOf: '2026-10',
      source: 'nfz_live',
    });
  });

  it('without coordinates aggregates the whole province (incl. facilities without lat/lng)', async () => {
    const { body } = await get(
      makeApp('up'),
      '/v1/wait-times?examId=colonoscopy_screening&province=07',
    );
    expect(body).toMatchObject({ radiusKm: 0, facilitiesCount: 98, p50Days: 136, p75Days: 187 });
  });

  it('falls back to the snapshot when NFZ is down', async () => {
    const { status, body } = await get(makeApp('down'), url);
    expect(status).toBe(200);
    expect(body).toMatchObject({ source: 'nfz_snapshot', facilitiesCount: 36, p75Days: 187 });
  });

  it('returns 503 when NFZ is down and there is no snapshot', async () => {
    const { status, body } = await get(makeApp('down', '/nonexistent'), url);
    expect(status).toBe(503);
    expect(ApiErrorSchema.parse(body).error.code).toBe('data_unavailable');
  });

  it.each([
    ['missing province', '/v1/wait-times?examId=colonoscopy_screening'],
    ['unknown province', '/v1/wait-times?examId=colonoscopy_screening&province=17'],
    ['lat without lng', '/v1/wait-times?examId=colonoscopy_screening&province=07&lat=52.2'],
    ['non-numeric radius', '/v1/wait-times?examId=colonoscopy_screening&province=07&radiusKm=x'],
  ])('400 on %s', async (_name, badUrl) => {
    const { status, body } = await get(makeApp('up'), badUrl);
    expect(status).toBe(400);
    expect(ApiErrorSchema.parse(body).error.code).toBe('invalid_query');
  });

  it.each(['mammography', 'psa_discussion', 'no_such_exam'])(
    '400 unknown_exam for %s (not a queue exam in @naczas/rules)',
    async (examId) => {
      const { status, body } = await get(
        makeApp('up'),
        `/v1/wait-times?examId=${examId}&province=07`,
      );
      expect(status).toBe(400);
      expect(ApiErrorSchema.parse(body).error.code).toBe('unknown_exam');
    },
  );

  it('400 on an exam without NFZ queues (e.g. program exams)', async () => {
    const { status, body } = await get(
      makeApp('up'),
      '/v1/wait-times?examId=mammography&province=07',
    );
    expect(status).toBe(400);
    expect(ApiErrorSchema.parse(body).error.code).toBe('unknown_exam');
  });
});

it('serves skin_check from PORADNIA DERMATOLOGICZNA', async () => {
  const { status, body } = await get(
    makeApp('up'),
    `/v1/wait-times?examId=skin_check&province=07&${WARSAW}`,
  );
  expect(status).toBe(200);
  expect(body).toMatchObject({ facilitiesCount: 49, p50Days: 111, p75Days: 157, minDays: 10 });
});

describe('GET /v1/facilities', () => {
  const base = `/v1/facilities?examId=colonoscopy_screening&province=07&${WARSAW}&radiusKm=15`;

  it('sorts by shortest average wait, unknown waits last', async () => {
    const { status, body } = await get(makeApp('up'), `${base}&sort=soonest&limit=50`);
    expect(status).toBe(200);
    const res = FacilitiesResponseSchema.parse(body);
    expect(res.source).toBe('nfz_live');
    expect(res.items).toHaveLength(36);
    expect(res.items.slice(0, 5).map((f) => [f.waitDays, f.distanceKm])).toEqual([
      [17, 9.5],
      [23, 4.4],
      [27, 2.9],
      [60, 0.8],
      [60, 2.9], // equal waits → nearer first
    ]);
    // v1.4: every facility here has a pcus forecast, so no unknown waits trail the list
    expect(res.items.at(-1)?.waitDays).toBe(314);
    expect(res.items.every((f) => f.firstAvailableDate === null)).toBe(true);
  });

  it('sorts by distance and applies the default limit of 20', async () => {
    const { body } = await get(makeApp('up'), `${base}&sort=nearest`);
    const res = FacilitiesResponseSchema.parse(body);
    expect(res.items).toHaveLength(20);
    expect(res.items.slice(0, 3).map((f) => [f.waitDays, f.distanceKm])).toEqual([
      [60, 0.8],
      [97, 1.5],
      [141, 1.6],
    ]);
  });

  it('returns only the exact benefit (no "DLA DZIECI" via NFZ prefix match)', async () => {
    const { body } = await get(
      makeApp('up'),
      `/v1/facilities?examId=dental_checkup&province=07&${WARSAW}&limit=50`,
    );
    const res = FacilitiesResponseSchema.parse(body);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((f) => f.benefit === 'PORADNIA STOMATOLOGICZNA')).toBe(true);
  });

  it('falls back to the snapshot when NFZ is down', async () => {
    const { status, body } = await get(makeApp('down'), `${base}&limit=5`);
    expect(status).toBe(200);
    expect(FacilitiesResponseSchema.parse(body)).toMatchObject({ source: 'nfz_snapshot' });
  });

  it.each([
    [
      'sort=nearest without coordinates',
      '/v1/facilities?examId=colonoscopy_screening&province=07&sort=nearest',
    ],
    ['limit out of range', `${base}&limit=0`],
    ['unknown sort', `${base}&sort=cheapest`],
  ])('400 on %s', async (_name, badUrl) => {
    const { status, body } = await get(makeApp('up'), badUrl);
    expect(status).toBe(400);
    expect(ApiErrorSchema.parse(body).error.code).toBe('invalid_query');
  });
});

it('404 uses the error envelope', async () => {
  const { status, body } = await get(makeApp('up'), '/v1/nope');
  expect(status).toBe(404);
  expect(ApiErrorSchema.parse(body).error.code).toBe('not_found');
});
