import { format, parseISO } from 'date-fns';

import type { ISODate } from '@naczas/shared';

/** 'YYYY-MM-DD' → 'DD.MM.YYYY' (Polish numeric date). */
export function formatDatePl(date: ISODate): string {
  return format(parseISO(date), 'dd.MM.yyyy');
}
