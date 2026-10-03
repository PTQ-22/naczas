import { MOCK_TODAY, mockPlan } from '@naczas/rules';
import type { PlanItem } from '@naczas/shared';

import {
  countActNow,
  dateMessage,
  groupSections,
  isCollapsedByDefault,
  planCta,
  summaryMessage,
  waitWeeks,
  whyNowMessage,
} from '../plan-view-model';

const plan = mockPlan({ today: MOCK_TODAY });
const byUrgency = (u: PlanItem['urgency']): PlanItem => {
  const item = plan.items.find((i) => i.urgency === u);
  if (!item) throw new Error(`mock has no ${u} item`);
  return item;
};

describe('groupSections', () => {
  it('orders sections act_now → booked → this_year → later → done', () => {
    expect(groupSections(plan.items).map((s) => s.urgency)).toEqual([
      'act_now',
      'booked',
      'this_year',
      'later',
      'done',
    ]);
  });

  it('drops empty sections', () => {
    expect(groupSections([byUrgency('done')]).map((s) => s.urgency)).toEqual(['done']);
    expect(groupSections([])).toEqual([]);
  });
});

describe('isCollapsedByDefault', () => {
  it('collapses done always and later only in senior mode', () => {
    expect(isCollapsedByDefault('done', false)).toBe(true);
    expect(isCollapsedByDefault('later', false)).toBe(false);
    expect(isCollapsedByDefault('later', true)).toBe(true);
    expect(isCollapsedByDefault('act_now', true)).toBe(false);
  });
});

describe('summaryMessage (Polish plural)', () => {
  it.each([
    [0, 'plan.summary.none'],
    [1, 'plan.summary.one'],
    [2, 'plan.summary.few'],
    [4, 'plan.summary.few'],
    [5, 'plan.summary.many'],
    [12, 'plan.summary.many'],
    [22, 'plan.summary.few'],
  ] as const)('%i → %s', (n, key) => {
    expect(summaryMessage(n).key).toBe(key);
  });
});

describe('waitWeeks', () => {
  it('rounds days to weeks, never below 1', () => {
    expect(waitWeeks(98)).toBe(14);
    expect(waitWeeks(3)).toBe(1);
  });
});

describe('dateMessage', () => {
  it('uses month/year for due items and full date for booked', () => {
    expect(dateMessage(byUrgency('act_now'))).toEqual({
      key: 'plan.card.dueBy',
      params: { date: '10.2026' },
    });
    expect(dateMessage(byUrgency('booked'))).toEqual({
      key: 'plan.card.bookedFor',
      params: { date: '15.10.2026' },
    });
    expect(dateMessage(byUrgency('later')).key).toBe('plan.card.nextAround');
  });
});

describe('whyNowMessage', () => {
  it('explains the queue for act_now / this_year queue exams only', () => {
    expect(whyNowMessage(byUrgency('act_now'), 'queue')?.key).toBe('plan.card.whyNowQueue');
    expect(whyNowMessage(byUrgency('this_year'), 'queue')?.key).toBe('plan.card.startFrom');
    expect(whyNowMessage(byUrgency('act_now'), 'program')).toBeNull();
    expect(whyNowMessage(byUrgency('later'), 'queue')).toBeNull();
  });
});

describe('planCta', () => {
  const actNow = byUrgency('act_now');

  it('maps booking type to a single CTA', () => {
    expect(planCta(actNow, 'queue', true)).toMatchObject({
      action: 'facilities',
      variant: 'primary',
      label: { key: 'plan.cta.findSlot', params: { weeks: 14 } },
    });
    expect(planCta(actNow, 'program', false)).toMatchObject({
      action: 'exam',
      variant: 'secondary',
    });
    expect(planCta(actNow, 'walk_in', false)?.label.key).toBe('plan.cta.walkIn');
  });

  it('booked → mark done; later and done → no CTA', () => {
    expect(planCta(byUrgency('booked'), 'program', false)?.action).toBe('markDone');
    expect(planCta(byUrgency('later'), 'queue', false)).toBeNull();
    expect(planCta(byUrgency('done'), 'queue', false)).toBeNull();
  });
});

describe('countActNow', () => {
  it('counts urgent items for the profile badge', () => {
    expect(countActNow(plan.items)).toBe(1);
  });
});
