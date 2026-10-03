import { z } from 'zod';

/** 'YYYY-MM-DD' */
export const ISODateSchema = z.iso.date();
export type ISODate = z.infer<typeof ISODateSchema>;

export const SexSchema = z.enum(['female', 'male']);
export type Sex = z.infer<typeof SexSchema>;

/** NFZ province codes */
export const ProvinceCodeSchema = z.enum([
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
]);
export type ProvinceCode = z.infer<typeof ProvinceCodeSchema>;

/**
 * Only diagnoses that change an NFZ program (docs/01-user-journey.md §Ankieta):
 * the first four exclude ChUK, 'copd' excludes spirometry and counts for lung LDCT at 50–54,
 * 'immunosuppression' (HIV or immunosuppressive drugs) shortens the HPV test interval.
 */
export const ConditionSchema = z.enum([
  'diabetes',
  'chronic_kidney_disease',
  'familial_hypercholesterolemia',
  'heart_disease',
  'copd',
  'immunosuppression',
]);
export type Condition = z.infer<typeof ConditionSchema>;

/** Cancers in parents, siblings or children; each one has an NFZ consequence. */
export const FamilyHistorySchema = z.enum([
  'colorectal_cancer',
  'breast_cancer',
  'ovarian_cancer',
  'endometrial_cancer',
]);
export type FamilyHistory = z.infer<typeof FamilyHistorySchema>;

export const SmokingStatusSchema = z.enum(['never', 'former', 'current']);
export type SmokingStatus = z.infer<typeof SmokingStatusSchema>;

/** 0–1 / 2–3 / 4+ days per week */
export const ActivityLevelSchema = z.enum(['low', 'medium', 'high']);
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  relation: z.enum(['self', 'parent', 'partner', 'child', 'other']),
  birthYear: z.number(),
  sex: SexSchema,
  location: z
    .object({
      province: ProvinceCodeSchema,
      lat: z.number(),
      lng: z.number(),
      label: z.string(),
    })
    .optional(),
  conditions: z.array(ConditionSchema),
  familyHistory: z.array(FamilyHistorySchema),
  smoking: z.object({
    status: SmokingStatusSchema,
    packYears: z.number().optional(),
    /** Former smokers only: lung LDCT requires quitting at most 15 years ago. */
    quitOver15y: z.boolean().optional(),
    /** Occupational exposure, radon, lung cancer in a 1st-degree relative or selected past cancers. */
    otherLungRisk: z.boolean().optional(),
  }),
  activity: ActivityLevelSchema.optional(),
  subscribedExams: z.array(z.string()).optional(),
  createdAt: ISODateSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

/**
 * Survey answer to "when was it last done", relative to the exam's interval: within the first
 * half of it, within the second half, or longer ago. Lives only in the onboarding draft — saving
 * the survey turns the dated buckets into an assumed date (`assumedLastDone` in packages/rules).
 */
export const LastDoneAnswerSchema = z.enum([
  'within_half_interval',
  'within_interval',
  'over_interval',
  'never',
  'unknown',
]);
export type LastDoneAnswer = z.infer<typeof LastDoneAnswerSchema>;

/** Last-done answers a record keeps without a date. */
export const UndatedLastDoneSchema = z.enum(['over_interval', 'never', 'unknown']);
export type UndatedLastDone = z.infer<typeof UndatedLastDoneSchema>;

export const ExamRecordSchema = z.object({
  profileId: z.string(),
  examId: z.string(),
  lastDone: z.union([ISODateSchema, UndatedLastDoneSchema]).optional(),
  status: z.enum(['none', 'booked', 'done']),
  bookedFor: ISODateSchema.optional(),
  updatedAt: ISODateSchema,
});
export type ExamRecord = z.infer<typeof ExamRecordSchema>;
