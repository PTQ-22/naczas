import { z } from 'zod';

import {
  ApiErrorSchema,
  CoverageSchema,
  FacilitiesResponseSchema,
  type Coverage,
  type CoverageProgram,
  WaitTimeSummarySchema,
  type FacilitiesResponse,
  type ProvinceCode,
  type WaitTimeSummary,
} from '@naczas/shared';

/** Cold NFZ fetches can take ~30 s server-side; past this we plan with defaults instead. */
export const DEFAULT_TIMEOUT_MS = 10_000;

// Expo Go on a phone can't reach the laptop's "localhost" — set EXPO_PUBLIC_API_URL to its LAN IP.
// Typed via `unknown`: process.env is `any` or typed depending on whether `expo start` has
// generated expo-env.d.ts (gitignored), and lint must pass either way.
const envApiUrl: unknown = process.env.EXPO_PUBLIC_API_URL;
const API_BASE_URL =
  typeof envApiUrl === 'string' && envApiUrl ? envApiUrl : 'http://localhost:8787';

export interface LocationParams {
  examId: string;
  province: ProvinceCode;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface FacilitiesParams extends LocationParams {
  /** 'nearest' needs lat/lng — the API rejects it otherwise. */
  sort?: 'soonest' | 'nearest';
  limit?: number;
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface CoverageParams {
  program: CoverageProgram;
  province?: ProvinceCode;
  lat?: number;
  lng?: number;
}

// Function properties, not methods: callers may pass them around unbound (no `this`).
export interface ApiClient {
  getWaitTimes: (params: LocationParams, options?: RequestOptions) => Promise<WaitTimeSummary>;
  getFacilities: (
    params: FacilitiesParams,
    options?: RequestOptions,
  ) => Promise<FacilitiesResponse>;
  getCoverage: (params: CoverageParams, options?: RequestOptions) => Promise<Coverage>;
}

export type ApiErrorKind = 'timeout' | 'network' | 'http' | 'invalid_response' | 'aborted';

export class ApiRequestError extends Error {
  override name = 'ApiRequestError';
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
    /** `error.code` from the API body, e.g. 'unknown_exam', 'data_unavailable'. */
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Errors that mean "no data right now" — callers fall back to cached/default lead times. */
export function isOfflineError(error: unknown): boolean {
  if (!(error instanceof ApiRequestError)) return false;
  if (error.kind === 'timeout' || error.kind === 'network') return true;
  return error.kind === 'http' && error.status !== undefined && error.status >= 500;
}

/** Privacy (AGENTS.md §8): never send more than ~1 km precision. */
export const roundCoord = (n: number) => Math.round(n * 100) / 100;

/** Only contract fields go into the query string — nothing else from the profile. */
export function buildQuery(params: FacilitiesParams): string {
  const query = new URLSearchParams({ examId: params.examId, province: params.province });
  if (params.lat !== undefined && params.lng !== undefined) {
    query.set('lat', String(roundCoord(params.lat)));
    query.set('lng', String(roundCoord(params.lng)));
  }
  if (params.radiusKm !== undefined) query.set('radiusKm', String(params.radiusKm));
  if (params.sort) query.set('sort', params.sort);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  return query.toString();
}

/** Coverage needs only the programme and the (rounded) place — never anything about the person. */
export function buildCoverageQuery(params: CoverageParams): string {
  const query = new URLSearchParams({ program: params.program });
  if (params.province) query.set('province', params.province);
  if (params.lat !== undefined && params.lng !== undefined) {
    query.set('lat', String(roundCoord(params.lat)));
    query.set('lng', String(roundCoord(params.lng)));
  }
  return query.toString();
}

async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions,
  fetchImpl: typeof fetch,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    let res: Response;
    try {
      res = await fetchImpl(`${API_BASE_URL}${path}`, { signal: controller.signal });
    } catch (err) {
      if (timedOut) throw new ApiRequestError('timeout', `Timed out after ${timeoutMs} ms`);
      if (signal?.aborted) throw new ApiRequestError('aborted', 'Request aborted');
      throw new ApiRequestError('network', err instanceof Error ? err.message : 'Network error');
    }

    const body: unknown = await res.json().catch(() => undefined);
    if (!res.ok) {
      const apiError = ApiErrorSchema.safeParse(body);
      throw new ApiRequestError(
        'http',
        apiError.success ? apiError.data.error.message : `HTTP ${res.status}`,
        res.status,
        apiError.success ? apiError.data.error.code : undefined,
      );
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiRequestError('invalid_response', `Unexpected response for ${path}`);
    }
    return parsed.data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

export function createHttpApi(fetchImpl: typeof fetch = (...args) => fetch(...args)): ApiClient {
  return {
    getWaitTimes: (params, options = {}) =>
      getJson(`/v1/wait-times?${buildQuery(params)}`, WaitTimeSummarySchema, options, fetchImpl),
    getFacilities: (params, options = {}) =>
      getJson(`/v1/facilities?${buildQuery(params)}`, FacilitiesResponseSchema, options, fetchImpl),
    getCoverage: (params, options = {}) =>
      getJson(`/v1/coverage?${buildCoverageQuery(params)}`, CoverageSchema, options, fetchImpl),
  };
}
