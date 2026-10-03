import { useEffect } from 'react';

import { usePlan } from '@/services';

import { countActNow } from './plan-view-model';

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
  const count = countActNow(plan.items);
  useEffect(() => onCount(profileId, count), [profileId, count, onCount]);
  return null;
}
