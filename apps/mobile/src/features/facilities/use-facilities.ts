import { useCallback, useEffect, useState } from 'react';

import { FacilitiesResponseSchema } from '@naczas/shared';
import type { FacilitiesResponse, Facility, ProvinceCode } from '@naczas/shared';

import { apiConfig } from './api-config';
import mockFacilities from './mock-facilities.json';

export type FacilitiesSort = 'soonest' | 'nearest';

export interface FacilitiesQuery {
  examId: string;
  province: ProvinceCode;
  lat?: number;
  lng?: number;
  radiusKm: number;
  sort: FacilitiesSort;
}

export type FacilitiesState =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: FacilitiesResponse };

const LIMIT = 20;

/** Privacy (AGENTS.md §8): coordinates leave the device rounded to ~1 km. */
const roundCoord = (n: number) => Math.round(n * 100) / 100;

// Same order as the API (routes/facilities.ts): unknown waits last.
const bySoonest = (a: Facility, b: Facility) =>
  (a.waitDays ?? Infinity) - (b.waitDays ?? Infinity) || a.distanceKm - b.distanceKm;
const byNearest = (a: Facility, b: Facility) => a.distanceKm - b.distanceKm;

/**
 * Recorded from the real API (/v1/facilities, woj. 07, Warszawa, 2026-10-03) for the four
 * queue exams. Marked as snapshot because it is not live data.
 */
function mockResponse(q: FacilitiesQuery): FacilitiesResponse {
  const raw: unknown = (mockFacilities as Record<string, unknown>)[q.examId] ?? [];
  const items = FacilitiesResponseSchema.shape.items.parse(raw);
  return {
    examId: q.examId,
    items: items
      .filter((f) => f.distanceKm <= q.radiusKm)
      .sort(q.sort === 'nearest' ? byNearest : bySoonest),
    source: 'nfz_snapshot',
  };
}

/**
 * TODO(WS3): move to src/services/api.ts once it lands in main; the hook should only call it.
 */
export async function fetchFacilities(
  q: FacilitiesQuery,
  init?: { signal?: AbortSignal },
): Promise<FacilitiesResponse> {
  const { baseUrl, useMocks } = apiConfig();
  if (useMocks) return mockResponse(q);

  const params = new URLSearchParams({
    examId: q.examId,
    province: q.province,
    radiusKm: String(q.radiusKm),
    sort: q.sort,
    limit: String(LIMIT),
  });
  if (q.lat !== undefined && q.lng !== undefined) {
    params.set('lat', String(roundCoord(q.lat)));
    params.set('lng', String(roundCoord(q.lng)));
  }
  const res = await fetch(`${baseUrl}/v1/facilities?${params.toString()}`, init);
  if (!res.ok) throw new Error(`facilities: HTTP ${res.status}`);
  // External data is validated at the boundary (AGENTS.md §3).
  return FacilitiesResponseSchema.parse(await res.json());
}

export function useFacilities(q: FacilitiesQuery | null): FacilitiesState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  // Results are tagged with the request they answer; anything else reads as "loading". This
  // avoids resetting state synchronously inside the effect when the query changes.
  const [result, setResult] = useState<{ key: string; state: FacilitiesState } | null>(null);

  const { examId, province, lat, lng, radiusKm, sort } = q ?? {};
  const key = JSON.stringify([examId, province, lat, lng, radiusKm, sort, attempt]);
  useEffect(() => {
    if (!examId || !province || radiusKm === undefined || !sort) return;
    const controller = new AbortController();
    fetchFacilities({ examId, province, lat, lng, radiusKm, sort }, { signal: controller.signal })
      .then((data) => setResult({ key, state: { status: 'success', data } }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, state: { status: 'error' } });
      });
    return () => controller.abort();
  }, [key, examId, province, lat, lng, radiusKm, sort]);

  const state: FacilitiesState = result?.key === key ? result.state : { status: 'loading' };
  return { ...state, retry };
}
