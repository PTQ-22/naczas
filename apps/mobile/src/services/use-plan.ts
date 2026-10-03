import { useCallback, useEffect, useMemo, useState } from 'react';

import { computePlan } from '@naczas/rules';
import type { Plan } from '@naczas/shared';

import { recordsForProfile, useProfilesStore, useRecordsStore, useToday } from '@/store';

import { USE_MOCKS, waitTimesLoader } from './client';
import { mockWaitTimes } from './mock-plan-data';
import { queueExamIds, waitTimesKey, type WaitTimes, type WaitTimesLoader } from './wait-times';

/**
 * - loading: wait times are being fetched; `plan` already exists with default lead times
 * - offline: some lead times are remembered/default because the API was unreachable
 */
export type PlanStatus = 'loading' | 'ready' | 'offline';

export interface PlanState {
  /** Empty (no items) when the profile doesn't exist. */
  plan: Plan;
  /** Exactly what was passed to computePlan — for "W okolicy czeka się ok. N tyg." */
  waitTimes: WaitTimes;
  status: PlanStatus;
  /** Refetch wait times, bypassing the in-memory cache. */
  refresh: () => void;
}

export interface UsePlanOptions {
  loader?: WaitTimesLoader;
  /** Defaults to EXPO_PUBLIC_USE_MOCKS. Only adds sample wait times for profiles without a location. */
  useMocks?: boolean;
}

interface Fetched {
  requestKey: string;
  locationKey: string;
  waitTimes: WaitTimes;
  offline: boolean;
}

const NO_WAIT_TIMES: WaitTimes = {};

/**
 * Plan for one profile. Offline-first: the plan is computed locally right away and recomputed
 * when NFZ wait times arrive, so the screen never waits on the network.
 */
export function usePlan(profileId: string, options: UsePlanOptions = {}): PlanState {
  const { loader = waitTimesLoader, useMocks = USE_MOCKS } = options;
  const profile = useProfilesStore((s) => s.profiles.find((p) => p.id === profileId));
  const allRecords = useRecordsStore((s) => s.records);
  const intervalOverrides = useRecordsStore((s) => s.intervalOverrides);
  const today = useToday();
  const [refreshCount, setRefreshCount] = useState(0);
  const [fetched, setFetched] = useState<Fetched | null>(null);

  const records = useMemo(() => recordsForProfile(allRecords, profileId), [allRecords, profileId]);
  const location = profile?.location;
  const examIds = useMemo(() => (profile ? queueExamIds(profile, today) : []), [profile, today]);

  // Without a location there's nothing to ask the API for — defaults it is.
  const locationKey =
    location && examIds.length > 0
      ? examIds.map((id) => waitTimesKey(id, location)).join(',')
      : null;
  const requestKey = locationKey ? `${locationKey}#${refreshCount}` : null;

  useEffect(() => {
    if (!requestKey || !locationKey || !location) return;
    const controller = new AbortController();
    loader
      .load(examIds, location, { signal: controller.signal, force: refreshCount > 0 })
      .then(({ waitTimes, offline }) => {
        if (!controller.signal.aborted) setFetched({ requestKey, locationKey, waitTimes, offline });
      })
      .catch(() => {
        // load() turns API errors into defaults; nothing else to surface here.
      });
    return () => controller.abort();
    // requestKey encodes examIds, location and refreshCount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, loader]);

  // While refreshing, keep the previous wait times instead of flashing defaults — but never
  // reuse them for another profile/location.
  const waitTimes = useMemo(() => {
    // Mock mode still asks the (mock) API when it can; samples only fill the no-location gap.
    if (useMocks && !location) return mockWaitTimes('07');
    return fetched && fetched.locationKey === locationKey ? fetched.waitTimes : NO_WAIT_TIMES;
  }, [useMocks, location, fetched, locationKey]);

  // Always the real engine — in mock mode too, so survey answers and booked/done change the plan.
  const plan = useMemo(
    (): Plan =>
      profile
        ? computePlan({ profile, records, intervalOverrides, waitTimes, today })
        : { profileId, generatedAt: today, items: [] },
    [profile, profileId, records, intervalOverrides, waitTimes, today],
  );

  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  let status: PlanStatus = 'ready';
  if (requestKey !== null) {
    if (fetched?.requestKey !== requestKey) status = 'loading';
    else if (fetched.offline) status = 'offline';
  }

  return { plan, waitTimes, status, refresh };
}
