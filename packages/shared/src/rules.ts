import { z } from 'zod';

import { ConditionSchema, FamilyHistorySchema, ISODateSchema, SexSchema } from './domain';

export const BookingTypeSchema = z.enum(['walk_in', 'program', 'queue']);
export type BookingType = z.infer<typeof BookingTypeSchema>;

/** Inclusive [from, to] age range */
const AgeRangeSchema = z.tuple([z.number(), z.number()]);

const EligibilityFactorSchema = z.union([
  ConditionSchema,
  FamilyHistorySchema,
  z.literal('smoker_20py'),
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
  }),
  modifiers: z
    .array(
      z.object({
        when: ModifierTriggerSchema,
        age: AgeRangeSchema.optional(),
        intervalMonths: z.number().optional(),
        note: z.string(), // PL
      }),
    )
    .optional(),
  intervalMonths: z.number(),
  booking: BookingTypeSchema,
  referral: z.boolean(), // whether NFZ requires a referral
  nfzBenefits: z.array(z.string()).optional(), // exact names from NFZ /benefits (for 'queue')
  programUrl: z.string().optional(), // for 'program'
  prepTips: z.array(z.string()).optional(), // PL
  source: z.object({ name: z.string(), url: z.string() }),
  verified: z.boolean(),
  verifiedAt: ISODateSchema.optional(),
});
export type ExamRule = z.infer<typeof ExamRuleSchema>;
