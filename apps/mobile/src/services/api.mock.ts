import { format } from 'date-fns';
import { z } from 'zod';

import {
  CoverageSchema,
  FacilitiesResponseSchema,
  cancelSimulatedCall,
  createSimulatedCallTask,
  retrySimulatedCallNow,
  simulatedCallStatus,
  type SimulatedCallTask,
  WaitTimeSummarySchema,
  type Facility,
} from '@naczas/shared';

import { ApiRequestError, type ApiClient, type FacilitiesParams } from './api';
import coverageJson from './mock-data/coverage.json';
import facilitiesJson from './mock-data/facilities.json';
import waitTimesJson from './mock-data/wait-times.json';

/*
 * mock-data/*.json are real API responses: apps/api `createApp` run against WS2's recorded NFZ
 * fixtures (apps/api/test/fixtures/queues, NFZ data as of 2026-09), for provinces 06 (origin
 * Kraków 50.06,19.94) and 07 (origin Warsaw 52.23,21.01), sort=soonest, limit=10.
 * Other provinces get province 07's data relabelled, so the demo works anywhere.
 */
const FALLBACK_PROVINCE = '07';

const waitTimes = z.array(WaitTimeSummarySchema).parse(waitTimesJson);
const facilities = z
  .array(FacilitiesResponseSchema.extend({ province: z.string() }))
  .parse(facilitiesJson);

// Real /v1/coverage answers for Warsaw (demo location), NFZ data as of 2026-10-01.
const coverage = z.array(CoverageSchema).parse(coverageJson);

const unknownExam = (examId: string) =>
  new ApiRequestError('http', `No NFZ queue data for examId "${examId}"`, 400, 'unknown_exam');

function pick<T extends { examId: string }>(
  list: T[],
  examId: string,
  province: string,
  provinceOf: (item: T) => string,
): T {
  const forExam = list.filter((item) => item.examId === examId);
  const match =
    forExam.find((item) => provinceOf(item) === province) ??
    forExam.find((item) => provinceOf(item) === FALLBACK_PROVINCE);
  if (!match) throw unknownExam(examId);
  return match;
}

const byNearest = (a: Facility, b: Facility) => a.distanceKm - b.distanceKm;

export function createMockApi({
  delayMs = 300,
  now = () => Date.now(),
}: { delayMs?: number; now?: () => number } = {}): ApiClient {
  // Same scripted call as the API's simulated mode (shared), so offline/web demos match.
  const calls = new Map<string, SimulatedCallTask>();

  // Small delay so loading states are visible in the demo, like the real API.
  const respond = <T>(produce: () => T) =>
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(produce());
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      }, delayMs);
    });

  return {
    getWaitTimes: (params) =>
      respond(() => ({
        ...pick(waitTimes, params.examId, params.province, (w) => w.province),
        province: params.province,
      })),
    getFacilities: (params: FacilitiesParams) =>
      respond(() => {
        const hasOrigin = params.lat !== undefined && params.lng !== undefined;
        if (params.sort === 'nearest' && !hasOrigin) {
          throw new ApiRequestError(
            'http',
            'sort=nearest requires lat and lng',
            400,
            'invalid_query',
          );
        }
        const { province: _province, ...response } = pick(
          facilities,
          params.examId,
          params.province,
          (f) => f.province,
        );
        // Mirrors the API: without an origin there is no distance.
        let items = hasOrigin
          ? response.items
          : response.items.map((f) => ({ ...f, distanceKm: 0 }));
        if (params.sort === 'nearest') items = [...items].sort(byNearest);
        return { ...response, items: items.slice(0, params.limit ?? 20) };
      }),
    getCoverage: (params) =>
      respond(() => {
        const match = coverage.find((c) => c.program === params.program);
        if (!match) throw new ApiRequestError('http', 'No coverage data', 404, 'no_data');
        return match;
      }),
    startCallAssist: (req) =>
      respond(() => {
        const callId = `sim-${calls.size + 1}-${now()}`;
        calls.set(callId, createSimulatedCallTask(req, format(now(), 'yyyy-MM-dd'), now()));
        return { callId, mode: 'simulated' as const };
      }),
    getCallAssist: (callId) =>
      respond(() => {
        const task = calls.get(callId);
        if (!task) throw new ApiRequestError('http', 'Unknown call id', 404, 'unknown_call');
        return simulatedCallStatus(callId, task, now());
      }),
    retryCallAssistNow: (callId) =>
      respond(() => {
        const task = calls.get(callId);
        if (!task) throw new ApiRequestError('http', 'Unknown call id', 404, 'unknown_call');
        if (simulatedCallStatus(callId, task, now()).status !== 'retry_scheduled') {
          throw new ApiRequestError('http', 'No retry is scheduled', 409, 'not_waiting');
        }
        const next = retrySimulatedCallNow(task, now());
        calls.set(callId, next);
        return simulatedCallStatus(callId, next, now());
      }),
    cancelCallAssist: (callId) =>
      respond(() => {
        const task = calls.get(callId);
        if (!task) throw new ApiRequestError('http', 'Unknown call id', 404, 'unknown_call');
        const next = cancelSimulatedCall(task, now());
        calls.set(callId, next);
        return simulatedCallStatus(callId, next, now());
      }),
  };
}
