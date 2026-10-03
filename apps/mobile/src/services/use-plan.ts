import { useCallback, useEffect, useMemo, useState } from 'react';

import { computePlan } from '@naczas/rules';
import type { Plan } from '@naczas/shared';

import { recordsForProfile, useProfilesStore, useRecordsStore, useToday } from '@/store';

import { waitTimesLoader } from './client';
import { queueExamIds, waitTimesKey, type WaitTimes, type WaitTimesLoader } from './wait-times';

export interface PlanState {
  /** null only when the profile doesn't exist. */
  plan: Plan | null;
  /** Wait times are being fetched; `plan` already exists (default lead times). */
  loading: boolean;
  /** Some lead times are cached/default because the API was unreachable. */
  offline: boolean;
  /** Refetch wait times, bypassing the in-memory cache. */
  refresh: () => void;
}

interface Fetched {
  requestKey: string;
  locationKey: string;
  waitTimes: WaitTimes;
  offline: boolean;
}

/**
 * Plan for one profile. Offline-first: the plan is computed locally right away and recomputed
 * when NFZ wait times arrive, so the screen never waits on the network.
 */
export function usePlan(profileId: string, loader: WaitTimesLoader = waitTimesLoader): PlanState {
  const profile = useProfilesStore((s) => s.profiles.find((p) => p.id === profileId));
  const allRecords = useRecordsStore((s) => s.records);
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
        // load() handles API errors itself; only an abort can land here.
      });
    return () => controller.abort();
    // requestKey encodes examIds, location and refreshCount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, loader]);

  // While refreshing, keep the previous wait times instead of flashing defaults — but never
  // reuse them for another profile/location.
  const waitTimes = fetched?.locationKey === locationKey ? fetched?.waitTimes : undefined;
  const plan = useMemo(
    () => (profile ? computePlan({ profile, records, waitTimes: waitTimes ?? {}, today }) : null),
    [profile, records, waitTimes, today],
  );

  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  return {
    plan,
    loading: requestKey !== null && fetched?.requestKey !== requestKey,
    offline: requestKey !== null && fetched?.requestKey === requestKey && fetched.offline,
    refresh,
  };
}
