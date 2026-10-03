import { z } from 'zod';

import { ConditionSchema, FamilyHistorySchema, ISODateSchema, SexSchema } from './domain';

export const BookingTypeSchema = z.enum(['walk_in', 'program', 'queue']);
export type BookingType = z.infer<typeof BookingTypeSchema>;

/** Inclusive [from, to] age range */
const AgeRangeSchema = z.tuple([z.number(), z.number()]);

/** Derived from the profile by `profileFactors` in packages/rules. */
const DerivedFactorSchema = z.enum([
  'smoker_20py', // current or former (quit ≤ 15 y) with ≥ 20 pack-years
  'smoker_20py_lung_risk', // smoker_20py + COPD or another lung cancer risk factor
  'current_smoker',
  'current_smoker_no_copd',
]);

const EligibilityFactorSchema = z.union([
  ConditionSchema,
  FamilyHistorySchema,
  DerivedFactorSchema,
]);
const ModifierTriggerSchema = z.union([EligibilityFactorSchema, z.literal('low_activity')]);

export const ExamRuleSchema = z.object({
  id: z.string(), // e.g. 'colonoscopy_screening'
  name: z.string(), // PL, for UI
  shortReason: z.string(), // PL, one-sentence "why"
  description: z.string(), // PL, 2–4 plain-language sentences
  eligibility: z.object({
    sex: SexSchema.optional(),
    age: AgeRangeSchema.optional(),
    requiresAny: z.array(EligibilityFactorSchema).optional(),
    excludesAny: z.array(EligibilityFactorSchema).optional(),
  }),
  modifiers: z
    .array(
      z.object({
        when: ModifierTriggerSchema.optional(), // absent → applies by age only
        age: AgeRangeSchema.optional(),
        intervalMonths: z.number().optional(),
        note: z.string(), // PL
      }),
    )
    .optional(),
  intervalMonths: z.number(),
  booking: BookingTypeSchema,
  referral: z.boolean(), // whether NFZ requires a referral
  referralNote: z.string().optional(), // PL, 1 sentence: referral / how to sign up
  nfzBenefits: z.array(z.string()).optional(), // exact names from NFZ /benefits (for 'queue')
  programUrl: z.string().optional(), // for 'program'
  prepTips: z.array(z.string()).optional(), // PL
  source: z.object({ name: z.string(), url: z.string() }),
  verified: z.boolean(),
  verifiedAt: ISODateSchema.optional(),
});
export type ExamRule = z.infer<typeof ExamRuleSchema>;
