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

export const ConditionSchema = z.enum(['diabetes', 'hypertension', 'heart_disease', 'other']);
export type Condition = z.infer<typeof ConditionSchema>;

export const FamilyHistorySchema = z.enum([
  'breast_cancer',
  'colorectal_cancer',
  'prostate_cancer',
  'ovarian_cancer',
  'early_cardiovascular', // heart attack/stroke in a 1st-degree relative < 60 y.o.
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
  smoking: z.object({ status: SmokingStatusSchema, packYears: z.number().optional() }),
  activity: ActivityLevelSchema.optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  subscribedExams: z.array(z.string()).optional(),
  createdAt: ISODateSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

/** Survey answer to "when was it last done", before the user gives an exact date */
export const LastDoneAnswerSchema = z.enum(['within_1y', '1_3y', 'over_3y', 'never', 'unknown']);
export type LastDoneAnswer = z.infer<typeof LastDoneAnswerSchema>;

export const ExamRecordSchema = z.object({
  profileId: z.string(),
  examId: z.string(),
  lastDone: z.union([ISODateSchema, LastDoneAnswerSchema]).optional(),
  status: z.enum(['none', 'booked', 'done']),
  bookedFor: ISODateSchema.optional(),
  updatedAt: ISODateSchema,
});
export type ExamRecord = z.infer<typeof ExamRecordSchema>;
