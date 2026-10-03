import { ConditionSchema, FamilyHistorySchema } from '@naczas/shared';

/**
 * Survey v2 (docs/01-user-journey.md §Ankieta) dropped answers that changed nothing in the plan:
 * hypertension, "other" condition, prostate cancer and early heart attack/stroke in the family,
 * height and weight. Saved data still holds them, and the new schemas reject unknown enum values,
 * so without this the whole store would be reset on hydration.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const keepKnown = (list: unknown, isKnown: (v: unknown) => boolean): unknown =>
  Array.isArray(list) ? list.filter(isKnown) : list;

function dropFromRecord(answers: Record<string, unknown>): Record<string, unknown> {
  const { heightCm: _height, weightKg: _weight, ...rest } = answers;
  return {
    ...rest,
    conditions: keepKnown(rest.conditions, (v) => ConditionSchema.safeParse(v).success),
    familyHistory: keepKnown(rest.familyHistory, (v) => FamilyHistorySchema.safeParse(v).success),
  };
}

/** Removes retired answers from a Profile or an onboarding draft; leaves anything else as is. */
export function dropRetiredAnswers(answers: unknown): unknown {
  return isRecord(answers) ? dropFromRecord(answers) : answers;
}

/** profiles store v1 → v2 */
export function migrateProfilesV1(state: unknown): unknown {
  if (!isRecord(state) || !Array.isArray(state.profiles)) return state;
  return { ...state, profiles: state.profiles.map(dropRetiredAnswers) };
}

/** onboarding-draft store v1 → v2: also adds the new smoking follow-up answers. */
export function migrateDraftV1(state: unknown): unknown {
  if (!isRecord(state) || !isRecord(state.draft)) return state;
  return {
    ...state,
    draft: { quitOver15y: null, otherLungRisk: null, ...dropFromRecord(state.draft) },
  };
}
