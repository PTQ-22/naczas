import { describe, expect, it } from 'vitest';

import type { Profile } from '@naczas/shared';

import {
  ageAt,
  effectiveIntervalMonths,
  eligibleExams,
  getExamRule,
  isEligible,
  profileFactors,
  reasonsFor,
  rules,
} from '../src';

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
  it('collects conditions, family history, derived smoking factors and low_activity', () => {
    const f = profileFactors(
      person(60, {
        conditions: ['diabetes'],
        familyHistory: ['breast_cancer'],
        ...heavySmoker,
        activity: 'low',
      }),
    );
    expect([...f].sort()).toEqual([
      'breast_cancer',
      'current_smoker',
      'current_smoker_no_copd',
      'diabetes',
      'low_activity',
      'smoker_20py',
    ]);
  });

  it('former smokers count for smoker_20py only within 15 years of quitting', () => {
    const former = (quitOver15y?: boolean) =>
      profileFactors(person(60, { smoking: { status: 'former', packYears: 30, quitOver15y } }));
    expect(former(false).has('smoker_20py')).toBe(true);
    expect(former(undefined).has('smoker_20py')).toBe(true); // unanswered → qualifying visit checks
    expect(former(true).has('smoker_20py')).toBe(false);
    expect(former(false).has('current_smoker')).toBe(false);
  });

  it('smoker_20py_lung_risk needs COPD or another lung risk factor', () => {
    const smoker = (overrides: Partial<Profile>) =>
      profileFactors(person(52, { ...heavySmoker, ...overrides }));
    expect(smoker({}).has('smoker_20py_lung_risk')).toBe(false);
    expect(smoker({ conditions: ['copd'] }).has('smoker_20py_lung_risk')).toBe(true);
    expect(
      smoker({ smoking: { status: 'current', packYears: 25, otherLungRisk: true } }).has(
        'smoker_20py_lung_risk',
      ),
    ).toBe(true);
    expect(smoker({ conditions: ['copd'] }).has('current_smoker_no_copd')).toBe(false);
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
  ['tobacco_program', person(25, heavySmoker), person(25), 'non-smoker'],
  [
    'cardiovascular_check',
    person(45),
    person(45, { conditions: ['diabetes'] }),
    'diabetes (under GP care)',
  ],
  ['eye_exam', person(40), person(39), 'below 40'],
  ['skin_check', person(18), person(17), 'below 18'],
  ['psa_discussion', person(55, { sex: 'male' }), person(55), 'female'],
];

describe('isEligible — every rule has a positive and a negative case', () => {
  it('covers every standard rule in exams.json', () => {
    const standardRules = rules.filter((r) => r.source.name !== 'Custom');
    expect(cases.map(([id]) => id).sort()).toEqual(standardRules.map((r) => r.id).sort());
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

describe('lung_ldct (Dz.U. 2026 poz. 976)', () => {
  const ldct = getExamRule('lung_ldct');

  it('50–54 qualifies only with an extra risk factor', () => {
    expect(isEligible(ldct, person(52, heavySmoker), TODAY)).toBe(false);
    expect(isEligible(ldct, person(52, { ...heavySmoker, conditions: ['copd'] }), TODAY)).toBe(
      true,
    );
    expect(
      isEligible(
        ldct,
        person(52, { smoking: { status: 'current', packYears: 25, otherLungRisk: true } }),
        TODAY,
      ),
    ).toBe(true);
    expect(isEligible(ldct, person(49, { ...heavySmoker, conditions: ['copd'] }), TODAY)).toBe(
      false,
    );
  });

  it('excludes former smokers who quit more than 15 years ago', () => {
    const quit = (quitOver15y: boolean) =>
      person(60, { smoking: { status: 'former', packYears: 30, quitOver15y } });
    expect(isEligible(ldct, quit(false), TODAY)).toBe(true);
    expect(isEligible(ldct, quit(true), TODAY)).toBe(false);
  });
});

describe('cardiovascular_check (ChUK)', () => {
  const chuk = getExamRule('cardiovascular_check');

  it.each(['diabetes', 'chronic_kidney_disease', 'familial_hypercholesterolemia', 'heart_disease'])(
    '%s excludes',
    (condition) => {
      const conditions = [condition] as Profile['conditions'];
      expect(isEligible(chuk, person(50, { conditions }), TODAY)).toBe(false);
    },
  );

  it('COPD or immunosuppression does not exclude; age 35–65 only', () => {
    expect(isEligible(chuk, person(50, { conditions: ['copd', 'immunosuppression'] }), TODAY)).toBe(
      true,
    );
    expect(isEligible(chuk, person(34), TODAY)).toBe(false);
    expect(isEligible(chuk, person(66), TODAY)).toBe(false);
  });
});

describe('tobacco_program', () => {
  const tobacco = getExamRule('tobacco_program');

  it('only current smokers; spirometry note at 40–65 without COPD', () => {
    expect(
      isEligible(tobacco, person(30, { smoking: { status: 'former', packYears: 30 } }), TODAY),
    ).toBe(false);
    const smoker = person(50, { smoking: { status: 'current' } });
    expect(reasonsFor(tobacco, smoker, TODAY)).toHaveLength(2);
    expect(reasonsFor(tobacco, { ...smoker, conditions: ['copd'] }, TODAY)).toHaveLength(1);
    expect(reasonsFor(tobacco, person(30, { smoking: { status: 'current' } }), TODAY)).toHaveLength(
      1,
    );
  });
});

describe('cervical_screening interval', () => {
  it('is 12 months with HIV / immunosuppressive drugs, otherwise 60', () => {
    const cervical = getExamRule('cervical_screening');
    expect(effectiveIntervalMonths(cervical, person(34), TODAY)).toBe(60);
    expect(
      effectiveIntervalMonths(cervical, person(34, { conditions: ['immunosuppression'] }), TODAY),
    ).toBe(12);
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
