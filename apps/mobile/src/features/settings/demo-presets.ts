import { addMonths, addYears, format, parseISO } from 'date-fns';

import type { ISODate } from '@naczas/shared';

export type DemoPreset = 'today' | 'plus1m' | 'plus3m' | 'plus1y' | 'reset';
export const DEMO_PRESETS: readonly DemoPreset[] = ['today', 'plus1m', 'plus3m', 'plus1y', 'reset'];

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * New todayOverride for a preset. "+N" steps from the date the app currently uses, so the
 * presenter can keep fast-forwarding; "today" pins the real date; "reset" follows the clock again.
 */
export function applyDemoPreset(
  preset: DemoPreset,
  effectiveToday: ISODate,
  realToday: ISODate,
): ISODate | null {
  const from = parseISO(effectiveToday);
  switch (preset) {
    case 'today':
      return realToday;
    case 'plus1m':
      return iso(addMonths(from, 1));
    case 'plus3m':
      return iso(addMonths(from, 3));
    case 'plus1y':
      return iso(addYears(from, 1));
    case 'reset':
      return null;
  }
}
