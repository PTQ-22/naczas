import { useCallback, useEffect, useState } from 'react';

import type { FacilitiesResponse, ProvinceCode } from '@naczas/shared';

import { api } from '@/services';

export type FacilitiesSort = 'soonest' | 'nearest';

export interface FacilitiesQuery {
  examId: string;
  province: ProvinceCode;
  lat?: number;
  lng?: number;
  /** Omitted by default: the API starts at 15 km and widens (15 → 30 → 60 → province). */
  radiusKm?: number;
  sort: FacilitiesSort;
  /** Defaults to 20; the doctors tab asks for the API max (50) so its filters have more to work with. */
  limit?: number;
}

export type FacilitiesState =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: FacilitiesResponse };

const DEFAULT_LIMIT = 20;
/** A cold NFZ fetch can take ~30 s server-side; this screen has nothing to fall back to. */
const TIMEOUT_MS = 30_000;

/** Facilities for one exam near the user, via the shared API client (mock mode included). */
export function useFacilities(q: FacilitiesQuery | null): FacilitiesState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  // Results are tagged with the request they answer; anything else reads as "loading". This
  // avoids resetting state synchronously inside the effect when the query changes.
  const [result, setResult] = useState<{ key: string; state: FacilitiesState } | null>(null);

  const { examId, province, lat, lng, radiusKm, sort, limit = DEFAULT_LIMIT } = q ?? {};
  const key = JSON.stringify([examId, province, lat, lng, radiusKm, sort, limit, attempt]);
  useEffect(() => {
    if (!examId || !province || !sort) return;
    const controller = new AbortController();
    // Coordinates are rounded to ~1 km inside the client (AGENTS.md §8).
    api
      .getFacilities(
        {
          examId,
          province,
          lat,
          lng,
          ...(radiusKm !== undefined && { radiusKm }),
          sort,
          limit,
        },
        { signal: controller.signal, timeoutMs: TIMEOUT_MS },
      )
      .then((data) => setResult({ key, state: { status: 'success', data } }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, state: { status: 'error' } });
      });
    return () => controller.abort();
  }, [key, examId, province, lat, lng, radiusKm, sort, limit]);

  const state: FacilitiesState = result?.key === key ? result.state : { status: 'loading' };
  return { ...state, retry };
}
