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
import { createSnapshotStore } from '../src/nfz/snapshot';

// Expected numbers computed independently (Python) from the recorded fixtures,
// for coordinates already rounded to 2 decimals (the server rounds too).
const WARSAW = 'lat=52.23&lng=21.01';
const FIXTURES_AS_SNAPSHOT = await buildSnapshotFromFixtures();
const noWait = () => Promise.resolve();
const now = () => new Date('2026-10-04T10:00:00Z');

function makeApp(nfz: 'up' | 'down', snapshotDir = FIXTURES_AS_SNAPSHOT) {
  const fetch =
    nfz === 'up'
      ? fixtureFetch(loadAllFixtures()).fetch
      : vi.fn<typeof globalThis.fetch>(() => Promise.resolve(rateLimitedResponse()));
  return createApp({
    nfz: createNfzClient({ fetch, minIntervalMs: 0, sleep: noWait }),
    snapshot: createSnapshotStore(snapshotDir),
    now,
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
      facilitiesCount: 35,
      p50Days: 141,
      p75Days: 200,
      minDays: 23,
      asOf: '2026-09',
      source: 'nfz_live',
    });
  });

  it('falls back to the snapshot when NFZ is down', async () => {
    const { status, body } = await get(makeApp('down'), url);
    expect(status).toBe(200);
    expect(body).toMatchObject({ source: 'nfz_snapshot', facilitiesCount: 35, p75Days: 200 });
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
  expect(body).toMatchObject({ facilitiesCount: 48, p50Days: 92, p75Days: 142, minDays: 10 });
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
      [23, 4.4],
      [40, 9.5],
      [49, 2.9],
      [55, 0.8],
      [61, 3.3],
    ]);
    expect(res.items.at(-1)?.waitDays).toBeNull();
    expect(res.items.every((f) => f.firstAvailableDate === null)).toBe(true);
  });

  it('sorts by distance and applies the default limit of 20', async () => {
    const { body } = await get(makeApp('up'), `${base}&sort=nearest`);
    const res = FacilitiesResponseSchema.parse(body);
    expect(res.items).toHaveLength(20);
    expect(res.items.slice(0, 3).map((f) => [f.waitDays, f.distanceKm])).toEqual([
      [55, 0.8],
      [null, 1.5],
      [156, 1.6],
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
