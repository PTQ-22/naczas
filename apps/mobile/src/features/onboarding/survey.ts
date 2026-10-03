import { eligibleExams } from '@naczas/rules';
import type { ExamRecord, ExamRule, ISODate, Profile } from '@naczas/shared';

import type { OnboardingDraft } from '@/store';

/** Order of survey screens (docs/01-user-journey.md §Ankieta). URL param is 1-based. */
export const SURVEY_STEPS = [
  'who',
  'basics',
  'location',
  'conditions',
  'familyHistory',
  'lifestyle',
  'lastExams',
] as const;
export type SurveyStep = (typeof SURVEY_STEPS)[number];
export const STEP_COUNT = SURVEY_STEPS.length;

/** `[step]` route param → 1-based step number, or null when it isn't a valid step. */
export function parseStepParam(param: unknown): number | null {
  const raw = Array.isArray(param) ? (param as unknown[])[0] : param;
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= STEP_COUNT ? n : null;
}

/** `?for=other` on the welcome route — validated, since URL params are external input. */
export function isForRelative(param: unknown): boolean {
  return param === 'other';
}

export function stepName(n: number): SurveyStep {
  return SURVEY_STEPS[n - 1] ?? 'who';
}

const OLDEST_AGE = 110;

export function birthYearRange(today: ISODate): { min: number; max: number } {
  const year = Number(today.slice(0, 4));
  return { min: year - OLDEST_AGE, max: year };
}

export function isBirthYearValid(birthYear: number | null, today: ISODate): boolean {
  if (birthYear === null || !Number.isInteger(birthYear)) return false;
  const { min, max } = birthYearRange(today);
  return birthYear >= min && birthYear <= max;
}

/**
 * Steps 1–2 (who, age, sex) can't be skipped: without age and sex no exam can be matched,
 * and the Profile contract requires them. Every other step has "Nie wiem / pomiń".
 */
export function isSkippable(step: SurveyStep): boolean {
  return step !== 'who' && step !== 'basics';
}

export function canContinue(step: SurveyStep, draft: OnboardingDraft, today: ISODate): boolean {
  switch (step) {
    case 'who':
      return (
        draft.who === 'self' ||
        (draft.who === 'other' && draft.name.trim().length > 0 && draft.relation !== null)
      );
    case 'basics':
      return isBirthYearValid(draft.birthYear, today) && draft.sex !== null;
    default:
      return true;
  }
}

/** What "Pomiń" clears on each skippable step — skipping means "no answer", not "keep old". */
export function skipPatch(step: SurveyStep): Partial<OnboardingDraft> {
  switch (step) {
    case 'location':
      return { location: null, postalCode: '' };
    case 'conditions':
      return { conditions: [] };
    case 'familyHistory':
      return { familyHistory: [] };
    case 'lifestyle':
      return { smoking: null, packYears: null, activity: null, heightCm: null, weightKg: null };
    case 'lastExams':
      return { lastDone: {} };
    default:
      return {};
  }
}

/**
 * Draft → Profile. Returns null until steps 1–2 are complete. A skipped smoking question is
 * stored as 'never' because the contract requires a status; that only means no smoking-based
 * exams are added — the user can correct it later.
 */
export function draftToProfile(
  draft: OnboardingDraft,
  options: { id: string; today: ISODate; selfName: string },
): Profile | null {
  const { id, today, selfName } = options;
  if (!canContinue('who', draft, today) || !canContinue('basics', draft, today)) return null;
  if (draft.birthYear === null || draft.sex === null) return null;

  const smokes = draft.smoking === 'current' || draft.smoking === 'former';
  const profile: Profile = {
    id,
    // "Dla mnie" asks for a name too; empty falls back to "Ja".
    name: draft.who === 'self' ? draft.name.trim() || selfName : draft.name.trim(),
    relation: draft.who === 'self' ? 'self' : (draft.relation ?? 'other'),
    birthYear: draft.birthYear,
    sex: draft.sex,
    conditions: [...draft.conditions],
    familyHistory: [...draft.familyHistory],
    smoking:
      smokes && draft.packYears !== null
        ? { status: draft.smoking ?? 'never', packYears: draft.packYears }
        : { status: draft.smoking ?? 'never' },
    createdAt: today,
  };
  if (draft.location) profile.location = { ...draft.location };
  if (draft.activity) profile.activity = draft.activity;
  if (draft.heightCm !== null) profile.heightCm = draft.heightCm;
  if (draft.weightKg !== null) profile.weightKg = draft.weightKg;
  return profile;
}

/** Step 7 asks only about exams that apply to this person (from the rules engine). */
export function examsToAsk(draft: OnboardingDraft, today: ISODate): ExamRule[] {
  const profile = draftToProfile(draft, { id: 'draft', today, selfName: '' });
  return profile ? eligibleExams(profile, today) : [];
}

/**
 * One record per answered exam that still applies. Unanswered exams get no record —
 * computePlan treats that exactly like "nie pamiętam".
 */
export function draftToRecords(
  draft: OnboardingDraft,
  profile: Profile,
  today: ISODate,
): ExamRecord[] {
  return eligibleExams(profile, today).flatMap((rule): ExamRecord[] => {
    const answer = draft.lastDone[rule.id];
    if (!answer) return [];
    return [
      {
        profileId: profile.id,
        examId: rule.id,
        lastDone: answer,
        status: 'none',
        updatedAt: today,
      },
    ];
  });
}
