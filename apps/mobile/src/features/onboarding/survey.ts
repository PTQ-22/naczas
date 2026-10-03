import { ageAt, eligibleExams } from '@naczas/rules';
import type { Condition, ExamRecord, ExamRule, ISODate, Profile } from '@naczas/shared';

import type { MessageKey } from '@/i18n';
import type { OnboardingDraft } from '@/store';

/**
 * Order of survey screens (docs/01-user-journey.md §Ankieta). Every question changes the plan,
 * the visit-prep summary or the facility search — see the doc for what each answer does.
 */
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

const inRange = (age: number, from: number, to: number) => age >= from && age <= to;
const draftAge = (draft: OnboardingDraft, today: ISODate) =>
  draft.birthYear === null ? null : ageAt(draft.birthYear, today);

/** ChUK exclusions (pacjent.gov.pl) — asked only in the program's age range. */
const CHUK_EXCLUSIONS = [
  'diabetes',
  'chronic_kidney_disease',
  'familial_hypercholesterolemia',
  'heart_disease',
] as const;

/** Step 4 options that can change something for this age and sex. */
export function conditionOptions(
  draft: OnboardingDraft,
  today: ISODate,
): Exclude<Condition, 'copd'>[] {
  const age = draftAge(draft, today);
  if (age === null) return [];
  return [
    ...(inRange(age, 35, 65) ? CHUK_EXCLUSIONS : []),
    // HPV test every 12 months instead of 5 years (Dz.U. 2025 poz. 298).
    ...(draft.sex === 'female' && inRange(age, 25, 64) ? (['immunosuppression'] as const) : []),
  ];
}

/** Which smoking follow-ups apply, given the answers so far (LDCT: Dz.U. 2026 poz. 976). */
export function smokingQuestions(draft: OnboardingDraft, today: ISODate) {
  const age = draftAge(draft, today) ?? 0;
  const { smoking } = draft;
  // An unanswered quit date keeps the LDCT path open, like in profileFactors.
  const recent = smoking === 'current' || (smoking === 'former' && draft.quitOver15y !== true);
  const packYears = recent && inRange(age, 50, 74);
  const lungPath5054 = packYears && (draft.packYears ?? 0) >= 20 && inRange(age, 50, 54);
  return {
    quit: smoking === 'former',
    packYears,
    // COPD excludes spirometry (current smokers 40–65) and counts for LDCT at 50–54.
    copd: (smoking === 'current' && inRange(age, 40, 65)) || lungPath5054,
    otherLungRisk: lungPath5054 && !draft.conditions.includes('copd'),
  };
}

/**
 * Steps shown for this draft: "conditions" disappears when none of its options applies.
 * Before age and sex are known it is counted, so "Krok X z Y" doesn't jump on steps 1–2.
 */
export function activeSteps(draft: OnboardingDraft, today: ISODate): SurveyStep[] {
  const unknown = draft.birthYear === null || draft.sex === null;
  return SURVEY_STEPS.filter(
    (step) => step !== 'conditions' || unknown || conditionOptions(draft, today).length > 0,
  );
}

/** `[step]` route param → 1-based step number, or null when it isn't a valid step. */
export function parseStepParam(param: unknown, stepCount: number): number | null {
  const raw = Array.isArray(param) ? (param as unknown[])[0] : param;
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= stepCount ? n : null;
}

/** `?for=other` on the welcome route — validated, since URL params are external input. */
export function isForRelative(param: unknown): boolean {
  return param === 'other';
}

export function stepAt(n: number, steps: readonly SurveyStep[]): SurveyStep {
  return steps[n - 1] ?? 'who';
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
 * Label of the skip button, or null when there is none. Steps 1–2 (who, age, sex) can't be
 * skipped: without age and sex no exam can be matched. Location is not a "don't know" question,
 * and once chosen, skipping would only throw it away.
 */
export function skipLabel(step: SurveyStep, draft: OnboardingDraft): MessageKey | null {
  if (step === 'who' || step === 'basics') return null;
  if (step === 'location') return draft.location ? null : 'onboarding.nav.skip';
  return 'onboarding.nav.dontKnow';
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

/**
 * What "Pomiń" clears on each skippable step — skipping means "no answer", not "keep old".
 * COPD is stored with conditions but asked on the lifestyle step, so each step clears only its own.
 */
export function skipPatch(step: SurveyStep, draft: OnboardingDraft): Partial<OnboardingDraft> {
  const copd = draft.conditions.filter((c) => c === 'copd');
  switch (step) {
    case 'location':
      return { location: null, postalCode: '' };
    case 'conditions':
      return { conditions: copd };
    case 'familyHistory':
      return { familyHistory: [] };
    case 'lifestyle':
      return {
        smoking: null,
        packYears: null,
        quitOver15y: null,
        otherLungRisk: null,
        activity: null,
        conditions: draft.conditions.filter((c) => c !== 'copd'),
      };
    case 'lastExams':
      return { lastDone: {} };
    default:
      return {};
  }
}

/**
 * Draft → Profile. Returns null until steps 1–2 are complete. A skipped smoking question is
 * stored as 'never' because the contract requires a status; that only means no smoking-based
 * exams are added — the user can correct it later. Answers to questions that no longer apply
 * (e.g. pack-years after switching to "never") are dropped, so they can't change the plan.
 */
export function draftToProfile(
  draft: OnboardingDraft,
  options: { id: string; today: ISODate; selfName: string },
): Profile | null {
  const { id, today, selfName } = options;
  if (!canContinue('who', draft, today) || !canContinue('basics', draft, today)) return null;
  if (draft.birthYear === null || draft.sex === null) return null;

  const asked = smokingQuestions(draft, today);
  const offered = new Set<Condition>(conditionOptions(draft, today));
  if (asked.copd) offered.add('copd');
  const conditions = draft.conditions.filter((c) => offered.has(c));
  const profile: Profile = {
    id,
    // "Dla mnie" asks for a name too; empty falls back to "Ja".
    name: draft.who === 'self' ? draft.name.trim() || selfName : draft.name.trim(),
    relation: draft.who === 'self' ? 'self' : (draft.relation ?? 'other'),
    birthYear: draft.birthYear,
    sex: draft.sex,
    conditions,
    familyHistory: [...draft.familyHistory],
    smoking: {
      status: draft.smoking ?? 'never',
      ...(asked.packYears && draft.packYears !== null && { packYears: draft.packYears }),
      ...(asked.quit && draft.quitOver15y !== null && { quitOver15y: draft.quitOver15y }),
      ...(asked.otherLungRisk &&
        draft.otherLungRisk !== null && { otherLungRisk: draft.otherLungRisk }),
    },
    createdAt: today,
  };
  if (draft.location) profile.location = { ...draft.location };
  if (draft.activity) profile.activity = draft.activity;
  return profile;
}

/** The last step asks only about exams that apply to this person (from the rules engine). */
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
