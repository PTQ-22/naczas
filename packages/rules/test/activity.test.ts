import { describe, expect, it } from 'vitest';

import type { ActivityLevel, Profile } from '@naczas/shared';

import { ACTIVITY_TIPS, activityTip } from '../src';

const TODAY = '2026-10-03';

const person = (age: number, activity?: ActivityLevel): Profile => ({
  id: 'p',
  name: 'Test',
  relation: 'self',
  birthYear: 2026 - age,
  sex: 'female',
  conditions: [],
  familyHistory: [],
  smoking: { status: 'never' },
  createdAt: TODAY,
  ...(activity ? { activity } : {}),
});

describe('activityTip', () => {
  it.each([
    ['low', 'adult_low', 150],
    ['medium', 'adult_medium', 150],
    ['high', 'adult_high', 300],
  ] as const)('adult with %s activity → %s', (activity, id, minutes) => {
    const tip = activityTip(person(40, activity), TODAY);
    expect(tip?.id).toBe(id);
    expect(tip?.minutesPerWeek).toBe(minutes);
  });

  it('no activity answer → general adult tip', () => {
    expect(activityTip(person(40), TODAY)?.id).toBe('adult_general');
  });

  it('65 is the boundary for the older-adult tip (balance and strength)', () => {
    expect(activityTip(person(64, 'medium'), TODAY)?.id).toBe('adult_medium');
    expect(activityTip(person(65, 'medium'), TODAY)?.id).toBe('senior');
    expect(activityTip(person(65), TODAY)?.id).toBe('senior');
    expect(activityTip(person(80, 'high'), TODAY)?.id).toBe('senior');
  });

  it('65+ with low activity gets the gentler start', () => {
    expect(activityTip(person(70, 'low'), TODAY)?.id).toBe('senior_low');
  });

  it('under 18 → null (adult guidelines do not apply)', () => {
    expect(activityTip(person(17, 'low'), TODAY)).toBeNull();
    expect(activityTip(person(18, 'low'), TODAY)).not.toBeNull();
  });

  it('depends on today, not the system clock', () => {
    const p = { ...person(64, 'medium') }; // born 1962
    expect(activityTip(p, '2026-12-31')?.id).toBe('adult_medium');
    expect(activityTip(p, '2027-01-01')?.id).toBe('senior');
  });

  it.each(Object.values(ACTIVITY_TIPS).map((t) => [t.id, t] as const))(
    '%s has PL texts and an https source',
    (_, tip) => {
      expect(tip.title.trim()).not.toBe('');
      expect(tip.body.trim()).not.toBe('');
      expect(tip.minutesPerWeek).toBeGreaterThan(0);
      expect(tip.source.url).toMatch(/^https:\/\/\S+$/);
    },
  );
});
