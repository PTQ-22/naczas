import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  ActivityLevelSchema,
  ConditionSchema,
  FamilyHistorySchema,
  LastDoneAnswerSchema,
  ProvinceCodeSchema,
  SexSchema,
  SmokingStatusSchema,
  type LastDoneAnswer,
} from '@naczas/shared';

import { validatedPersist } from './persist';
import { migrateDraftV1 } from './survey-v2-migration';

/** Survey answers so far. `null` = not answered (yet) or skipped. */
export const OnboardingDraftSchema = z.object({
  /** Started from Family → "Add person": step 1 skips the "for me" option. */
  forRelative: z.boolean(),
  who: z.enum(['self', 'other']).nullable(),
  name: z.string(),
  relation: z.enum(['parent', 'partner', 'child', 'other']).nullable(),
  birthYear: z.number().int().nullable(),
  sex: SexSchema.nullable(),
  postalCode: z.string(),
  location: z
    .object({ province: ProvinceCodeSchema, lat: z.number(), lng: z.number(), label: z.string() })
    .nullable(),
  conditions: z.array(ConditionSchema),
  familyHistory: z.array(FamilyHistorySchema),
  smoking: SmokingStatusSchema.nullable(),
  packYears: z.number().nullable(),
  quitOver15y: z.boolean().nullable(),
  otherLungRisk: z.boolean().nullable(),
  activity: ActivityLevelSchema.nullable(),
  /** examId → answer from step 7 */
  lastDone: z.record(z.string(), LastDoneAnswerSchema),
});
export type OnboardingDraft = z.infer<typeof OnboardingDraftSchema>;

export function emptyDraft(forRelative = false): OnboardingDraft {
  return {
    forRelative,
    who: forRelative ? 'other' : null,
    name: '',
    relation: null,
    birthYear: null,
    sex: null,
    postalCode: '',
    location: null,
    conditions: [],
    familyHistory: [],
    smoking: null,
    packYears: null,
    quitOver15y: null,
    otherLungRisk: null,
    activity: null,
    lastDone: {},
  };
}

const PersistedDraftSchema = z.object({ draft: OnboardingDraftSchema.nullable() });
type PersistedDraft = z.infer<typeof PersistedDraftSchema>;

interface OnboardingDraftState extends PersistedDraft {
  /** Starts a new survey, replacing any unfinished one. */
  start: (options?: { forRelative?: boolean }) => void;
  update: (patch: Partial<OnboardingDraft>) => void;
  setLastDone: (examId: string, answer: LastDoneAnswer) => void;
  clear: () => void;
}

/** Persisted after every answer, so closing the app mid-survey loses nothing. */
export const useOnboardingDraftStore = create<OnboardingDraftState>()(
  persist(
    (set) => ({
      draft: null,
      start: (options) => set({ draft: emptyDraft(options?.forRelative) }),
      update: (patch) => set((s) => ({ draft: { ...(s.draft ?? emptyDraft()), ...patch } })),
      setLastDone: (examId, answer) =>
        set((s) => {
          const draft = s.draft ?? emptyDraft();
          return { draft: { ...draft, lastDone: { ...draft.lastDone, [examId]: answer } } };
        }),
      clear: () => set({ draft: null }),
    }),
    validatedPersist<OnboardingDraftState, PersistedDraft>({
      name: 'onboarding-draft',
      version: 2,
      migrations: { 1: migrateDraftV1 },
      schema: PersistedDraftSchema,
      partialize: ({ draft }) => ({ draft }),
    }),
  ),
);
