import { useEffect } from 'react';

import { usePlan } from '@/services';

import { planLayout } from './plan-view-model';
import { useUnknownExamIds } from './use-unknown-exam-ids';

interface UrgentCountProbeProps {
  profileId: string;
  onCount: (profileId: string, count: number) => void;
}

/**
 * Renders nothing; reports how many act_now exams a (non-active) profile has. Exists because
 * hooks can't run in a loop and the switcher needs a badge on every person (M3 M1).
 */
export function UrgentCountProbe({ profileId, onCount }: UrgentCountProbeProps) {
  const { plan } = usePlan(profileId);
  // Same count as the active profile's badge: unknown-history exams aren't "urgent".
  const unknownIds = useUnknownExamIds(profileId, plan.items);
  const count = planLayout(plan.items, unknownIds).actNowCount;
  useEffect(() => onCount(profileId, count), [profileId, count, onCount]);
  return null;
}
