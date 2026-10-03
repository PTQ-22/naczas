import { emptyDraft, type OnboardingDraft } from '@/store/onboarding-draft-store';

import {
  activeSteps,
  canContinue,
  conditionOptions,
  draftToProfile,
  draftToRecords,
  examsToAsk,
  isBirthYearValid,
  isForRelative,
  parseStepParam,
  skipLabel,
  skipPatch,
  smokingQuestions,
  SURVEY_STEPS,
} from '../survey';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const TODAY = '2026-10-04';

const mamaDraft = (overrides: Partial<OnboardingDraft> = {}): OnboardingDraft => ({
  ...emptyDraft(true),
  name: ' Halina ',
  relation: 'parent',
  birthYear: 1968,
  sex: 'female',
  familyHistory: ['colorectal_cancer'],
  ...overrides,
});

describe('parseStepParam', () => {
  it('accepts 1..stepCount only', () => {
    expect(parseStepParam('1', 7)).toBe(1);
    expect(parseStepParam(['7'], 7)).toBe(7);
    expect(parseStepParam('7', 6)).toBeNull();
    expect(parseStepParam('0', 7)).toBeNull();
    expect(parseStepParam('2abc', 7)).toBeNull();
    expect(parseStepParam(undefined, 7)).toBeNull();
  });
});

describe('conditionOptions / activeSteps', () => {
  it('asks ChUK exclusions only at 35–65 and immunosuppression only for women 25–64', () => {
    expect(conditionOptions(mamaDraft({ sex: 'male' }), TODAY)).toEqual([
      'diabetes',
      'chronic_kidney_disease',
      'familial_hypercholesterolemia',
      'heart_disease',
    ]);
    expect(conditionOptions(mamaDraft(), TODAY)).toContain('immunosuppression');
    expect(conditionOptions(mamaDraft({ birthYear: 1994 }), TODAY)).toEqual(['immunosuppression']);
    expect(conditionOptions(mamaDraft({ birthYear: 1994, sex: 'male' }), TODAY)).toEqual([]);
    expect(conditionOptions(mamaDraft({ birthYear: 1950 }), TODAY)).toEqual([]);
  });

  it('drops the conditions step when nothing there applies', () => {
    expect(activeSteps(mamaDraft(), TODAY)).toEqual(SURVEY_STEPS);
    expect(activeSteps(mamaDraft({ birthYear: 1950 }), TODAY)).not.toContain('conditions');
    // Still counted before age and sex are known, so the step count doesn't jump on steps 1–2.
    expect(activeSteps(emptyDraft(), TODAY)).toEqual(SURVEY_STEPS);
  });
});

describe('smokingQuestions', () => {
  const at = (birthYear: number, overrides: Partial<OnboardingDraft>) =>
    smokingQuestions(mamaDraft({ birthYear, ...overrides }), TODAY);

  it('asks nothing more for never-smokers', () => {
    expect(at(1970, { smoking: 'never' })).toEqual({
      quit: false,
      packYears: false,
      copd: false,
      otherLungRisk: false,
    });
  });

  it('former smokers: pack-years only within 15 years of quitting and at 50–74', () => {
    expect(at(1966, { smoking: 'former' })).toMatchObject({ quit: true, packYears: true });
    expect(at(1966, { smoking: 'former', quitOver15y: true })).toMatchObject({ packYears: false });
    expect(at(1986, { smoking: 'former' })).toMatchObject({ packYears: false });
  });

  it('current smokers 40–65 are asked about COPD (spirometry exclusion)', () => {
    expect(at(1980, { smoking: 'current' })).toMatchObject({ copd: true, packYears: false });
    expect(at(1990, { smoking: 'current' })).toMatchObject({ copd: false });
  });

  it('50–54 with ≥ 20 pack-years: COPD, then other lung risk factors if no COPD', () => {
    const base = { smoking: 'former' as const, quitOver15y: false, packYears: 20 };
    expect(at(1974, base)).toMatchObject({ copd: true, otherLungRisk: true });
    expect(at(1974, { ...base, conditions: ['copd'] })).toMatchObject({ otherLungRisk: false });
    expect(at(1974, { ...base, packYears: 19 })).toMatchObject({ copd: false });
    expect(at(1966, base)).toMatchObject({ otherLungRisk: false }); // 60: no extra factor needed
  });
});

describe('skipLabel', () => {
  it('has no skip for who/basics, "Pomiń" for location until one is chosen', () => {
    expect(skipLabel('basics', mamaDraft())).toBeNull();
    expect(skipLabel('location', mamaDraft())).toBe('onboarding.nav.skip');
    expect(
      skipLabel(
        'location',
        mamaDraft({ location: { province: '15', lat: 52.4, lng: 16.9, label: 'Poznań' } }),
      ),
    ).toBeNull();
    expect(skipLabel('familyHistory', mamaDraft())).toBe('onboarding.nav.dontKnow');
  });
});

describe('isForRelative', () => {
  it('accepts only ?for=other', () => {
    expect(isForRelative('other')).toBe(true);
    expect(isForRelative('self')).toBe(false);
    expect(isForRelative(['other'])).toBe(false);
    expect(isForRelative(undefined)).toBe(false);
  });
});

describe('canContinue', () => {
  it('step 1 needs "for me" or a relative with name and relation', () => {
    expect(canContinue('who', emptyDraft(), TODAY)).toBe(false);
    expect(canContinue('who', { ...emptyDraft(), who: 'self' }, TODAY)).toBe(true);
    expect(canContinue('who', { ...emptyDraft(true), name: '  ' }, TODAY)).toBe(false);
    expect(canContinue('who', mamaDraft(), TODAY)).toBe(true);
  });

  it('step 2 needs a plausible birth year and sex', () => {
    expect(canContinue('basics', mamaDraft(), TODAY)).toBe(true);
    expect(canContinue('basics', mamaDraft({ sex: null }), TODAY)).toBe(false);
    expect(isBirthYearValid(2027, TODAY)).toBe(false);
    expect(isBirthYearValid(1915, TODAY)).toBe(false);
    expect(isBirthYearValid(1916, TODAY)).toBe(true);
  });

  it('later steps can always continue (multi-select, optional fields)', () => {
    expect(canContinue('conditions', emptyDraft(), TODAY)).toBe(true);
  });
});

describe('skipPatch', () => {
  it('clears the answers of the skipped step', () => {
    expect(skipPatch('familyHistory', mamaDraft())).toEqual({ familyHistory: [] });
    expect(skipPatch('location', mamaDraft())).toEqual({ location: null, postalCode: '' });
  });

  it('COPD belongs to the lifestyle step, not the conditions step', () => {
    const draft = mamaDraft({ conditions: ['diabetes', 'copd'] });
    expect(skipPatch('conditions', draft)).toEqual({ conditions: ['copd'] });
    expect(skipPatch('lifestyle', draft)).toMatchObject({
      conditions: ['diabetes'],
      smoking: null,
    });
  });
});

describe('draftToProfile', () => {
  it('is null until age and sex are known', () => {
    expect(
      draftToProfile(mamaDraft({ birthYear: null }), { id: 'x', today: TODAY, selfName: 'Ja' }),
    ).toBeNull();
  });

  it('maps a relative, trimming the name and defaulting skipped smoking to never', () => {
    expect(draftToProfile(mamaDraft(), { id: 'p1', today: TODAY, selfName: 'Ja' })).toEqual({
      id: 'p1',
      name: 'Halina',
      relation: 'parent',
      birthYear: 1968,
      sex: 'female',
      conditions: [],
      familyHistory: ['colorectal_cancer'],
      smoking: { status: 'never' },
      createdAt: TODAY,
    });
  });

  it('uses the self label for "for me" and keeps pack-years only for smokers', () => {
    const profile = draftToProfile(
      {
        ...emptyDraft(),
        who: 'self',
        name: '  ',
        birthYear: 1994,
        sex: 'female',
        smoking: 'never',
        packYears: 5,
        activity: 'high',
      },
      { id: 'p2', today: TODAY, selfName: 'Ja' },
    );
    expect(profile).toMatchObject({
      name: 'Ja',
      relation: 'self',
      smoking: { status: 'never' },
      activity: 'high',
    });
    expect(profile?.smoking).not.toHaveProperty('packYears');
  });

  it('uses the name given for "for me" when there is one', () => {
    const profile = draftToProfile(
      { ...emptyDraft(), who: 'self', name: ' Kasia ', birthYear: 1992, sex: 'female' },
      { id: 'p3', today: TODAY, selfName: 'Ja' },
    );
    expect(profile).toMatchObject({ name: 'Kasia', relation: 'self' });
  });
});

describe('draftToProfile — only answers that still apply', () => {
  const options = { id: 'p', today: TODAY, selfName: 'Ja' };

  it('keeps the smoking follow-ups that were asked', () => {
    const profile = draftToProfile(
      mamaDraft({
        birthYear: 1974,
        smoking: 'former',
        quitOver15y: false,
        packYears: 25,
        otherLungRisk: true,
      }),
      options,
    );
    expect(profile?.smoking).toEqual({
      status: 'former',
      packYears: 25,
      quitOver15y: false,
      otherLungRisk: true,
    });
  });

  it('drops stale answers after switching to "never" or out of the age range', () => {
    const stale = {
      smoking: 'never' as const,
      packYears: 25,
      quitOver15y: false,
      otherLungRisk: true,
      conditions: ['copd' as const, 'immunosuppression' as const],
    };
    expect(draftToProfile(mamaDraft({ ...stale, birthYear: 1956 }), options)).toMatchObject({
      conditions: [], // 70: immunosuppression is not asked, COPD not for never-smokers
      smoking: { status: 'never' },
    });
  });
});

describe('examsToAsk / draftToRecords', () => {
  it('asks about colonoscopy for a 58-year-old woman with colorectal cancer in the family', () => {
    const ids = examsToAsk(mamaDraft(), TODAY).map((r) => r.id);
    expect(ids).toContain('colonoscopy_screening');
    expect(ids).not.toContain('psa_discussion');
  });

  it('asks nothing before age and sex are known', () => {
    expect(examsToAsk(emptyDraft(), TODAY)).toEqual([]);
  });

  it('creates records only for answered exams that still apply', () => {
    const draft = mamaDraft({
      lastDone: { colonoscopy_screening: 'never', psa_discussion: 'within_1y' },
    });
    const profile = draftToProfile(draft, { id: 'p1', today: TODAY, selfName: 'Ja' });
    if (!profile) throw new Error('profile expected');

    expect(draftToRecords(draft, profile, TODAY)).toEqual([
      {
        profileId: 'p1',
        examId: 'colonoscopy_screening',
        lastDone: 'never',
        status: 'none',
        updatedAt: TODAY,
      },
    ]);
  });
});
