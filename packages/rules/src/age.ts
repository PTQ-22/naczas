import { getYear, parseISO } from 'date-fns';

import type { ISODate } from '@naczas/shared';

/**
 * Age as year(today) − birthYear. Deliberately ignores the birthday: we only store birthYear,
 * and NFZ programs ("Moje Zdrowie") also count eligibility by birth year.
 */
export function ageAt(birthYear: number, today: ISODate): number {
  return getYear(parseISO(today)) - birthYear;
}
