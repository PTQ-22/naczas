import { differenceInCalendarDays, parseISO } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  PlanSchema,
  ProfileSchema,
  UrgencySchema,
  type PlanItem,
  type Urgency,
} from '@naczas/shared';

import { MOCK_TODAY, mockPlan, mockProfileMama } from '../src';

describe('mockPlan', () => {
  it('returns a Plan valid against the shared contract', () => {
    expect(() => PlanSchema.parse(mockPlan())).not.toThrow();
    expect(() => ProfileSchema.parse(mockProfileMama)).not.toThrow();
  });

  it('has 5 items covering every urgency exactly once', () => {
    const urgencies = mockPlan().items.map((i) => i.urgency);
    expect(urgencies).toHaveLength(5);
    expect(new Set(urgencies)).toEqual(new Set(UrgencySchema.options));
  });

  it('is sorted act_now → booked → this_year → later → done', () => {
    expect(mockPlan().items.map((i) => i.urgency)).toEqual([
      'act_now',
      'booked',
      'this_year',
      'later',
      'done',
    ]);
  });

  it('keeps notifyDate = dueDate − leadTimeDays for every item', () => {
    for (const i of mockPlan().items) {
      expect(differenceInCalendarDays(parseISO(i.dueDate), parseISO(i.notifyDate))).toBe(
        i.leadTimeDays,
      );
    }
  });

  it('is consistent with the urgency rules relative to today', () => {
    const today = '2027-03-15';
    const plan = mockPlan({ today });
    const get = (u: Urgency): PlanItem => {
      const found = plan.items.find((i) => i.urgency === u);
      if (!found) throw new Error(`missing ${u}`);
      return found;
    };
    expect(get('act_now').notifyDate <= today).toBe(true);
    expect(get('this_year').notifyDate > today).toBe(true);
    expect(get('this_year').notifyDate <= '2027-12-31').toBe(true);
    expect(get('later').notifyDate > '2027-12-31').toBe(true);
    expect(get('done').dueDate > '2028-03-15').toBe(true);
  });

  it('is deterministic and uses the given today/profileId', () => {
    expect(mockPlan()).toEqual(mockPlan());
    expect(mockPlan().generatedAt).toBe(MOCK_TODAY);
    const plan = mockPlan({ today: '2027-01-01', profileId: 'x' });
    expect(plan.generatedAt).toBe('2027-01-01');
    expect(plan.items.every((i) => i.profileId === 'x')).toBe(true);
  });

  it('matches the mama persona: colonoscopy act_now, no PSA', () => {
    const items = mockPlan().items;
    expect(items[0]?.examId).toBe('colonoscopy_screening');
    expect(items.some((i) => i.examId === 'psa_discussion')).toBe(false);
  });
});
