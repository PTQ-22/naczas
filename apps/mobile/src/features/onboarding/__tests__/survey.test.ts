import { emptyDraft, type OnboardingDraft } from '@/store/onboarding-draft-store';

import {
  canContinue,
  draftToProfile,
  draftToRecords,
  examsToAsk,
  isBirthYearValid,
  isForRelative,
  parseStepParam,
  skipPatch,
  STEP_COUNT,
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
  it('accepts 1..7 only', () => {
    expect(parseStepParam('1')).toBe(1);
    expect(parseStepParam(['7'])).toBe(7);
    expect(parseStepParam('0')).toBeNull();
    expect(parseStepParam(String(STEP_COUNT + 1))).toBeNull();
    expect(parseStepParam('2abc')).toBeNull();
    expect(parseStepParam(undefined)).toBeNull();
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
    expect(skipPatch('familyHistory')).toEqual({ familyHistory: [] });
    expect(skipPatch('location')).toEqual({ location: null, postalCode: '' });
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
        name: 'ignored',
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
