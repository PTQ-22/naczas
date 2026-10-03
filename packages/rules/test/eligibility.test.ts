import { describe, expect, it } from 'vitest';

import type { Profile } from '@naczas/shared';

import { ageAt, eligibleExams, getExamRule, isEligible, profileFactors, rules } from '../src';

const TODAY = '2026-10-03';

/** Profile aged `age` on TODAY (age = year − birthYear). */
const person = (age: number, overrides: Partial<Profile> = {}): Profile => ({
  id: 'p',
  name: 'Test',
  relation: 'self',
  birthYear: 2026 - age,
  sex: 'female',
  conditions: [],
  familyHistory: [],
  smoking: { status: 'never' },
  createdAt: TODAY,
  ...overrides,
});

const heavySmoker = { smoking: { status: 'current' as const, packYears: 25 } };

describe('ageAt', () => {
  it('is year(today) − birthYear, independent of the day in the year', () => {
    expect(ageAt(1968, '2026-01-01')).toBe(58);
    expect(ageAt(1968, '2026-12-31')).toBe(58);
  });
});

describe('profileFactors', () => {
  it('collects conditions, family history, smoker_20py and low_activity', () => {
    const f = profileFactors(
      person(60, {
        conditions: ['diabetes'],
        familyHistory: ['breast_cancer'],
        ...heavySmoker,
        activity: 'low',
      }),
    );
    expect([...f].sort()).toEqual(['breast_cancer', 'diabetes', 'low_activity', 'smoker_20py']);
  });

  it('counts former smokers with ≥ 20 pack-years, not never-smokers or < 20', () => {
    expect(
      profileFactors(person(60, { smoking: { status: 'former', packYears: 20 } })).has(
        'smoker_20py',
      ),
    ).toBe(true);
    expect(
      profileFactors(person(60, { smoking: { status: 'current', packYears: 19 } })).has(
        'smoker_20py',
      ),
    ).toBe(false);
    expect(
      profileFactors(person(60, { smoking: { status: 'never', packYears: 30 } })).has(
        'smoker_20py',
      ),
    ).toBe(false);
  });
});

// Each rule: [examId, eligible profile, ineligible profile, why ineligible]
const cases: Array<[string, Profile, Profile, string]> = [
  ['health_check_adult', person(30), person(19), 'below 20'],
  ['dental_checkup', person(34), person(34), 'n/a — no criteria, see below'],
  ['cervical_screening', person(34), person(34, { sex: 'male' }), 'male'],
  ['mammography', person(58), person(58, { sex: 'male' }), 'male'],
  ['colonoscopy_screening', person(58), person(45), 'below 50 without family history'],
  ['lung_ldct', person(60, heavySmoker), person(60), 'non-smoker'],
  ['eye_exam', person(40), person(39), 'below 40'],
  ['skin_check', person(18), person(17), 'below 18'],
  ['psa_discussion', person(55, { sex: 'male' }), person(55), 'female'],
];

describe('isEligible — every rule has a positive and a negative case', () => {
  it('covers every rule in exams.json', () => {
    expect(cases.map(([id]) => id).sort()).toEqual(rules.map((r) => r.id).sort());
  });

  it.each(cases)('%s: eligible profile qualifies', (id, yes) => {
    expect(isEligible(getExamRule(id), yes, TODAY)).toBe(true);
  });

  it.each(cases.filter(([id]) => id !== 'dental_checkup'))(
    '%s: ineligible profile excluded (%s)',
    (id, _yes, no) => {
      expect(isEligible(getExamRule(id), no, TODAY)).toBe(false);
    },
  );

  // dental_checkup has no criteria (NFZ: all insured, any age), so no negative case exists.
  // Guard that assumption instead, so adding a criterion forces adding a negative test.
  it('dental_checkup: has no eligibility criteria, applies to any adult', () => {
    expect(getExamRule('dental_checkup').eligibility).toEqual({});
    expect(isEligible(getExamRule('dental_checkup'), person(90, { sex: 'male' }), TODAY)).toBe(
      true,
    );
  });
});

describe('modifiers extending the age range', () => {
  const colonoscopy = getExamRule('colonoscopy_screening');

  it('family history of colorectal cancer lowers colonoscopy start age to 40', () => {
    expect(
      isEligible(colonoscopy, person(40, { familyHistory: ['colorectal_cancer'] }), TODAY),
    ).toBe(true);
    expect(isEligible(colonoscopy, person(40), TODAY)).toBe(false);
  });

  it('still respects the lower bound of the extended range', () => {
    expect(
      isEligible(colonoscopy, person(39, { familyHistory: ['colorectal_cancer'] }), TODAY),
    ).toBe(false);
  });

  it('an unrelated family history does not extend the range', () => {
    expect(isEligible(colonoscopy, person(45, { familyHistory: ['breast_cancer'] }), TODAY)).toBe(
      false,
    );
  });

  it('above the base upper bound stays excluded', () => {
    expect(isEligible(colonoscopy, person(66), TODAY)).toBe(false);
  });
});

describe('age-only modifiers (no `when`)', () => {
  it('do not widen eligibility', () => {
    const rule = {
      ...getExamRule('eye_exam'),
      modifiers: [{ age: [18, 39] as [number, number], note: 'x' }],
    };
    expect(isEligible(rule, person(30), TODAY)).toBe(false);
  });
});

describe('requiresAny', () => {
  it('lung_ldct needs smoker_20py even inside the age range', () => {
    const ldct = getExamRule('lung_ldct');
    expect(isEligible(ldct, person(60, heavySmoker), TODAY)).toBe(true);
    expect(isEligible(ldct, person(54, heavySmoker), TODAY)).toBe(false);
    expect(
      isEligible(ldct, person(60, { smoking: { status: 'current', packYears: 5 } }), TODAY),
    ).toBe(false);
  });
});

describe('eligibleExams', () => {
  it('persona mama (58, F, colorectal cancer in family): colonoscopy + mammography, no PSA', () => {
    const ids = eligibleExams(person(58, { familyHistory: ['colorectal_cancer'] }), TODAY).map(
      (r) => r.id,
    );
    expect(ids).toEqual(
      expect.arrayContaining(['colonoscopy_screening', 'mammography', 'health_check_adult']),
    );
    expect(ids).not.toContain('psa_discussion');
    expect(ids).not.toContain('lung_ldct');
  });

  it('persona Kasia (34, F): cervical + dental, no colonoscopy or mammography', () => {
    const ids = eligibleExams(person(34), TODAY).map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['cervical_screening', 'dental_checkup']));
    expect(ids).not.toContain('colonoscopy_screening');
    expect(ids).not.toContain('mammography');
  });

  it('depends on today, not the system clock', () => {
    const p = person(19); // born 2007
    expect(eligibleExams(p, '2026-10-03').map((r) => r.id)).not.toContain('health_check_adult');
    expect(eligibleExams(p, '2027-01-01').map((r) => r.id)).toContain('health_check_adult');
  });
});
