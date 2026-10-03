import type { Urgency } from '@naczas/shared';

import type { IconName } from '@/components/Icon';

export const urgencyIcon: Record<Urgency, IconName> = {
  act_now: 'alert',
  this_year: 'calendar',
  later: 'time',
  booked: 'booked',
  done: 'check',
};
