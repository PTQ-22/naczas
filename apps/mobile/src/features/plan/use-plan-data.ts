import type { ISODate, Plan, Profile, WaitTimeSummary } from '@naczas/shared';

import { usePlan, type PlanStatus } from '@/services';
import { selectActiveProfile, useProfilesStore, useToday } from '@/store';

export interface PlanData {
  profiles: Profile[];
  /** undefined when no profile exists yet (entry route sends the user to onboarding). */
  activeProfile: Profile | undefined;
  /** null when there is no active profile. */
  plan: Plan | null;
  /** NFZ summaries per examId — the same ones computePlan used. */
  waitTimes: Record<string, WaitTimeSummary | undefined>;
  status: PlanStatus;
  today: ISODate;
  selectProfile: (id: string) => void;
}

/** Single seam between WS4 screens and WS3 state (store + usePlan). */
export function usePlanData(): PlanData {
  const profiles = useProfilesStore((s) => s.profiles);
  const activeProfile = useProfilesStore(selectActiveProfile);
  const selectProfile = useProfilesStore((s) => s.setActiveProfile);
  const today = useToday();
  const { plan, waitTimes, status } = usePlan(activeProfile?.id ?? '');
  return {
    profiles,
    activeProfile,
    plan: activeProfile ? plan : null,
    waitTimes,
    status,
    today,
    selectProfile,
  };
}
