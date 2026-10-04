'use strict';
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);
var domain_exports = {};
__export(domain_exports, {
  ActivityLevelSchema: () => ActivityLevelSchema,
  ConditionSchema: () => ConditionSchema,
  ExamRecordSchema: () => ExamRecordSchema,
  FamilyHistorySchema: () => FamilyHistorySchema,
  ISODateSchema: () => ISODateSchema,
  LastDoneAnswerSchema: () => LastDoneAnswerSchema,
  ProfileSchema: () => ProfileSchema,
  ProvinceCodeSchema: () => ProvinceCodeSchema,
  SexSchema: () => SexSchema,
  SmokingStatusSchema: () => SmokingStatusSchema,
  TimeOfDaySchema: () => TimeOfDaySchema,
  UndatedLastDoneSchema: () => UndatedLastDoneSchema,
});
module.exports = __toCommonJS(domain_exports);
var import_zod = require('zod');
const ISODateSchema = import_zod.z.iso.date();
const TimeOfDaySchema = import_zod.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const SexSchema = import_zod.z.enum(['female', 'male']);
const ProvinceCodeSchema = import_zod.z.enum([
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
const ConditionSchema = import_zod.z.enum([
  'diabetes',
  'chronic_kidney_disease',
  'familial_hypercholesterolemia',
  'heart_disease',
  'copd',
  'immunosuppression',
]);
const FamilyHistorySchema = import_zod.z.enum([
  'colorectal_cancer',
  'breast_cancer',
  'ovarian_cancer',
  'endometrial_cancer',
]);
const SmokingStatusSchema = import_zod.z.enum(['never', 'former', 'current']);
const ActivityLevelSchema = import_zod.z.enum(['low', 'medium', 'high']);
const ProfileSchema = import_zod.z.object({
  id: import_zod.z.string(),
  name: import_zod.z.string(),
  relation: import_zod.z.enum(['self', 'parent', 'partner', 'child', 'other']),
  birthYear: import_zod.z.number(),
  sex: SexSchema,
  location: import_zod.z
    .object({
      province: ProvinceCodeSchema,
      lat: import_zod.z.number(),
      lng: import_zod.z.number(),
      label: import_zod.z.string(),
    })
    .optional(),
  conditions: import_zod.z.array(ConditionSchema),
  familyHistory: import_zod.z.array(FamilyHistorySchema),
  smoking: import_zod.z.object({
    status: SmokingStatusSchema,
    packYears: import_zod.z.number().optional(),
    /** Former smokers only: lung LDCT requires quitting at most 15 years ago. */
    quitOver15y: import_zod.z.boolean().optional(),
    /** Occupational exposure, radon, lung cancer in a 1st-degree relative or selected past cancers. */
    otherLungRisk: import_zod.z.boolean().optional(),
  }),
  activity: ActivityLevelSchema.optional(),
  subscribedExams: import_zod.z.array(import_zod.z.string()).optional(),
  createdAt: ISODateSchema,
});
const LastDoneAnswerSchema = import_zod.z.enum([
  'within_half_interval',
  'within_interval',
  'over_interval',
  'never',
  'unknown',
]);
const UndatedLastDoneSchema = import_zod.z.enum(['over_interval', 'never', 'unknown']);
const ExamRecordSchema = import_zod.z.object({
  profileId: import_zod.z.string(),
  examId: import_zod.z.string(),
  lastDone: import_zod.z.union([ISODateSchema, UndatedLastDoneSchema]).optional(),
  status: import_zod.z.enum(['none', 'booked', 'done']),
  bookedFor: ISODateSchema.optional(),
  /** Visit hour, when known (booking screen, AI call). Absent = whole-day visit. */
  bookedTime: TimeOfDaySchema.optional(),
  updatedAt: ISODateSchema,
});
