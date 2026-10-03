import { describe, expect, it } from 'vitest';

import type { Facility } from '@naczas/shared';

import { loadFixture, type QueueFixture } from './helpers/nfz-fixtures';
import { haversineKm, radiusSteps } from '../src/aggregate/geo';
import { filterExactBenefits, monthToIsoDate, normalizeQueue } from '../src/aggregate/normalize';
import { percentile, summarizeWaitTimes } from '../src/aggregate/wait-times';
import { NfzQueueSchema, type NfzQueue } from '../src/nfz/schemas';

// Expected numbers below were computed independently (Python) from the same recorded fixtures.
const WARSAW = { lat: 52.2297, lng: 21.0122 };
const KRAKOW = { lat: 50.0614, lng: 19.9366 };
const GDANSK = { lat: 54.35, lng: 18.65 }; // outside province 07 — no facility within 60 km

const queuesOf = (fixture: QueueFixture): NfzQueue[] =>
  fixture.pages.flatMap((p) => p.data).map((r) => NfzQueueSchema.parse(r));

function facilitiesOf(fixture: QueueFixture, origin?: { lat: number; lng: number }): Facility[] {
  return filterExactBenefits(queuesOf(fixture), [fixture.request.benefit])
    .map((q) => normalizeQueue(q, { origin, fallbackAsOf: '2026-10-01' }))
    .filter((f): f is Facility => f !== null);
}

const colonoscopy07 = loadFixture('07', 'kolonoskopia');

describe('geo', () => {
  it('computes haversine distance', () => {
    expect(haversineKm(WARSAW, KRAKOW)).toBeCloseTo(252.5, 1);
    expect(haversineKm(WARSAW, WARSAW)).toBe(0);
  });

  it('widens from the requested radius through larger standard steps', () => {
    expect(radiusSteps(15)).toEqual([15, 30, 60]);
    expect(radiusSteps(5)).toEqual([5, 15, 30, 60]);
    expect(radiusSteps(50)).toEqual([50, 60]);
  });
});

describe('normalize', () => {
  it('maps a recorded NFZ queue to a Facility', () => {
    const [first] = queuesOf(colonoscopy07);
    expect(normalizeQueue(first!, { origin: WARSAW, fallbackAsOf: '2026-10-01' })).toEqual({
      id: '5ce93704-599d-48de-e063-b4200a0a429f',
      benefit: 'KOLONOSKOPIA',
      providerName: 'PRZYCHODNIA SPECJALISTYCZNA "CENTRUM MEDYCZNE JÓZEFÓW" SP. Z O.O.',
      placeName: 'PRACOWNIA ENDOSKOPII (KOLONOSKOPIA)',
      address: 'ARMII KRAJOWEJ 5',
      locality: 'JÓZEFÓW',
      phone: '227898989',
      lat: 52.148315,
      lng: 21.2191719,
      distanceKm: 16.8,
      firstAvailableDate: null,
      waitDays: null, // average-period = 0 → no data
      awaiting: 0,
      accessibility: { ramp: false, elevator: false, parking: false, toilet: false },
      asOf: '2026-09-01',
    });
  });

  const base = { id: 'q', attributes: { benefit: 'KOLONOSKOPIA', latitude: 52, longitude: 21 } };

  it('maps Y/N flags, average-period and an empty phone', () => {
    const queue = NfzQueueSchema.parse({
      ...base,
      attributes: {
        ...base.attributes,
        phone: '  ',
        ramp: 'Y',
        elevator: 'N',
        'car-park': 'Y',
        toilet: 'Y',
        statistics: { 'provider-data': { awaiting: 12, 'average-period': 45, update: '2026-08' } },
      },
    });
    expect(normalizeQueue(queue, { fallbackAsOf: '2026-10-01' })).toMatchObject({
      phone: null,
      waitDays: 45,
      awaiting: 12,
      distanceKm: 0,
      accessibility: { ramp: true, elevator: false, parking: true, toilet: true },
      asOf: '2026-08-01',
    });
  });

  it('falls back when statistics are missing', () => {
    const queue = NfzQueueSchema.parse({
      ...base,
      attributes: { ...base.attributes, statistics: {} },
    });
    expect(normalizeQueue(queue, { fallbackAsOf: '2026-10-01' })).toMatchObject({
      waitDays: null,
      awaiting: null,
      asOf: '2026-10-01',
    });
  });

  it('drops records without coordinates', () => {
    const queue = NfzQueueSchema.parse({ id: 'q', attributes: { benefit: 'X', latitude: null } });
    expect(normalizeQueue(queue, { fallbackAsOf: '2026-10-01' })).toBeNull();
  });

  it('keeps only the exact benefit (NFZ matches by prefix)', () => {
    const dental = loadFixture('07', 'poradnia-stomatologiczna');
    const exact = filterExactBenefits(queuesOf(dental), ['PORADNIA STOMATOLOGICZNA']);
    expect(exact).toHaveLength(625);
    expect(facilitiesOf(dental)).toHaveLength(587); // minus records without coordinates
  });

  it('converts statistics.update month to an ISO date', () => {
    expect(monthToIsoDate('2026-09')).toBe('2026-09-01');
    expect(monthToIsoDate('09.2026')).toBeNull();
  });
});

describe('percentile', () => {
  it('interpolates linearly and rounds to whole days', () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0.75)).toBe(33); // 32.5 → 33
    expect(percentile([7], 0.75)).toBe(7);
    expect(percentile([], 0.5)).toBeNull();
  });
});

describe('summarizeWaitTimes (fixtures)', () => {
  const summarize = (
    fixture: QueueFixture,
    origin: { lat: number; lng: number } | undefined,
    radiusKm: number,
  ) =>
    summarizeWaitTimes({
      examId: 'colonoscopy_screening',
      province: '07',
      facilities: facilitiesOf(fixture, origin),
      hasOrigin: origin !== undefined,
      radiusKm,
      fallbackAsOf: '2026-10',
      source: 'nfz_snapshot',
    });

  it('colonoscopy, Warsaw, 15 km', () => {
    expect(summarize(colonoscopy07, WARSAW, 15)).toEqual({
      examId: 'colonoscopy_screening',
      province: '07',
      radiusKm: 15,
      facilitiesCount: 35,
      p50Days: 141,
      p75Days: 200,
      minDays: 23,
      asOf: '2026-09',
      source: 'nfz_snapshot',
    });
  });

  it('honours a smaller requested radius when it already has enough facilities', () => {
    expect(summarize(colonoscopy07, WARSAW, 5)).toMatchObject({
      radiusKm: 5,
      facilitiesCount: 17,
      p50Days: 86,
      p75Days: 182,
      minDays: 23,
    });
  });

  it('uses the whole province without user coordinates', () => {
    expect(summarize(colonoscopy07, undefined, 15)).toMatchObject({
      radiusKm: 0,
      facilitiesCount: 88, // 90 with coordinates, 2 without average-period
      p50Days: 133,
      p75Days: 219,
      minDays: 12,
    });
  });

  it('falls back to the whole province when 60 km is not enough', () => {
    expect(summarize(colonoscopy07, GDANSK, 15)).toMatchObject({
      radiusKm: 409,
      facilitiesCount: 88,
      p50Days: 133,
    });
  });

  it('ophthalmology, Kraków, 15 km', () => {
    const eye06 = loadFixture('06', 'swiadczenia-z-zakresu-okulistyki');
    expect(summarize(eye06, KRAKOW, 15)).toMatchObject({
      radiusKm: 15,
      facilitiesCount: 30,
      p50Days: 218,
      p75Days: 308,
      minDays: 42,
    });
  });

  it('returns nulls when no facility has data', () => {
    expect(
      summarizeWaitTimes({
        examId: 'x',
        province: '07',
        facilities: [],
        hasOrigin: true,
        radiusKm: 15,
        fallbackAsOf: '2026-10',
        source: 'nfz_live',
      }),
    ).toMatchObject({
      facilitiesCount: 0,
      p50Days: null,
      p75Days: null,
      minDays: null,
      asOf: '2026-10',
    });
  });
});
