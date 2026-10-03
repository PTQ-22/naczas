import type { ISODate, Plan, Profile } from '@naczas/shared';

import { usePlan } from '@/services';
import { selectActiveProfile, useProfilesStore, useToday } from '@/store';

export interface PlanData {
  profiles: Profile[];
  /** undefined when no profile exists yet (entry route sends the user to onboarding). */
  activeProfile: Profile | undefined;
  plan: Plan | null;
  today: ISODate;
  /** NFZ wait times are still loading — the plan already shows default lead times. */
  loading: boolean;
  /** Some lead times are cached/default because the API was unreachable. */
  offline: boolean;
  selectProfile: (id: string) => void;
}

/** Single seam between WS4 screens and WS3 state (store + usePlan). */
export function usePlanData(): PlanData {
  const profiles = useProfilesStore((s) => s.profiles);
  const activeProfile = useProfilesStore(selectActiveProfile);
  const selectProfile = useProfilesStore((s) => s.setActiveProfile);
  const today = useToday();
  const { plan, loading, offline } = usePlan(activeProfile?.id ?? '');
  return { profiles, activeProfile, plan, today, loading, offline, selectProfile };
}
