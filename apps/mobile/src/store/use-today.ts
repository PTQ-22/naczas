import { format } from 'date-fns';

import type { ISODate } from '@naczas/shared';

import { useSettingsStore } from './settings-store';

/** Pure core of `useToday()` — takes `now` so it is testable. */
export function resolveToday(todayOverride: ISODate | null, now: Date): ISODate {
  return todayOverride ?? format(now, 'yyyy-MM-dd');
}

/**
 * The ONLY place the app reads the current date (AGENTS.md §3). Everything else gets `today`
 * passed in, so the demo "time travel" override reaches all of it at once.
 */
export function useToday(): ISODate {
  const todayOverride = useSettingsStore((s) => s.todayOverride);
  return resolveToday(todayOverride, new Date());
}
