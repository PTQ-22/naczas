import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { eligibleExams } from '@naczas/rules';
import {
  WaitTimeSummarySchema,
  type ISODate,
  type Profile,
  type WaitTimeSummary,
} from '@naczas/shared';

import { isOfflineError, roundCoord, type ApiClient } from './api';

export type WaitTimes = Record<string, WaitTimeSummary | undefined>;
export type PlanLocation = NonNullable<Profile['location']>;

/** Server data changes monthly; 24 h matches the API's own freshness window. */
export const MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
export const LAST_RESULT_KEY = 'naczas:wait-times-last';

const LastResultSchema = z.record(z.string(), WaitTimeSummarySchema);

/** Only 'queue' exams have NFZ data — the API answers 400 for 'program'/'walk_in'. */
export function queueExamIds(profile: Profile, today: ISODate): string[] {
  return eligibleExams(profile, today)
    .filter((rule) => rule.booking === 'queue')
    .map((rule) => rule.id);
}

export function waitTimesKey(examId: string, location: PlanLocation): string {
  return [examId, location.province, roundCoord(location.lat), roundCoord(location.lng)].join('|');
}

export interface LoadResult {
  waitTimes: WaitTimes;
  /** At least one exam fell back because the API was unreachable. */
  offline: boolean;
}

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export function createWaitTimesLoader(deps: {
  api: ApiClient;
  storage?: Storage;
  now?: () => number;
}) {
  const { api, storage = AsyncStorage, now = Date.now } = deps;
  const memory = new Map<string, { value: WaitTimeSummary; fetchedAt: number }>();

  async function readLast(): Promise<Record<string, WaitTimeSummary>> {
    try {
      const raw = await storage.getItem(LAST_RESULT_KEY);
      const parsed = LastResultSchema.safeParse(raw ? JSON.parse(raw) : {});
      return parsed.success ? parsed.data : {};
    } catch {
      return {};
    }
  }

  async function load(
    examIds: readonly string[],
    location: PlanLocation,
    options: { signal?: AbortSignal; force?: boolean } = {},
  ): Promise<LoadResult> {
    const waitTimes: WaitTimes = {};
    const fresh: Record<string, WaitTimeSummary> = {};
    let offline = false;
    let last: Record<string, WaitTimeSummary> | undefined;

    await Promise.all(
      examIds.map(async (examId) => {
        const key = waitTimesKey(examId, location);
        const cached = memory.get(key);
        if (!options.force && cached && now() - cached.fetchedAt < MEMORY_TTL_MS) {
          waitTimes[examId] = cached.value;
          return;
        }
        try {
          const value = await api.getWaitTimes(
            { examId, province: location.province, lat: location.lat, lng: location.lng },
            { signal: options.signal },
          );
          memory.set(key, { value, fetchedAt: now() });
          fresh[key] = value;
          waitTimes[examId] = value;
        } catch (err) {
          // Non-offline errors (e.g. 400 unknown_exam for an exam WS2 doesn't serve yet) just
          // mean "no NFZ data" → computePlan uses its default lead time.
          if (!isOfflineError(err)) return;
          offline = true;
          last ??= await readLast();
          const previous = last[key];
          // A remembered result is no longer live data — label it as a snapshot for the UI.
          if (previous) waitTimes[examId] = { ...previous, source: 'nfz_snapshot' };
        }
      }),
    );

    if (Object.keys(fresh).length > 0) {
      const merged = { ...(last ?? (await readLast())), ...fresh };
      await storage.setItem(LAST_RESULT_KEY, JSON.stringify(merged)).catch(() => undefined);
    }
    return { waitTimes, offline };
  }

  return { load };
}

export type WaitTimesLoader = ReturnType<typeof createWaitTimesLoader>;
