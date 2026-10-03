import { z } from 'zod';

import { ISODateSchema, ProvinceCodeSchema } from './domain';

const DataSourceSchema = z.enum(['nfz_live', 'nfz_snapshot']);

/** Error body returned by every endpoint with a non-2xx status */
export const ApiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** GET /v1/wait-times */
export const WaitTimeSummarySchema = z.object({
  examId: z.string(),
  province: ProvinceCodeSchema,
  radiusKm: z.number(), // actually used (may have been widened)
  facilitiesCount: z.number(),
  p50Days: z.number().nullable(),
  p75Days: z.number().nullable(), // used for leadTime
  minDays: z.number().nullable(),
  asOf: z.string(), // 'YYYY-MM' of the newest record (dates.date-situation-as-at, else statistics.update)
  source: DataSourceSchema,
});
export type WaitTimeSummary = z.infer<typeof WaitTimeSummarySchema>;

export const FacilitySchema = z.object({
  id: z.string(), // NFZ queue id
  benefit: z.string(),
  providerName: z.string(),
  placeName: z.string(),
  address: z.string(),
  locality: z.string(),
  phone: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  distanceKm: z.number(),
  firstAvailableDate: ISODateSchema.nullable(),
  waitDays: z.number().nullable(), // dates.pcus forecast in days, else average-period (docs/03)
  awaiting: z.number().nullable(), // statistics.provider-data.awaiting
  // NFZ `anesthesia` Y/N (e.g. colonoscopy under anaesthesia); null = NFZ doesn't say.
  // .default(null): responses from an older API without the field still parse.
  anesthesia: z.boolean().nullable().default(null),
  accessibility: z.object({
    ramp: z.boolean(),
    elevator: z.boolean(),
    parking: z.boolean(),
    toilet: z.boolean(),
  }),
  // dates.date-situation-as-at (v1.4, daily); without it statistics.update month → 'YYYY-MM-01'
  asOf: ISODateSchema,
});
export type Facility = z.infer<typeof FacilitySchema>;

/** GET /v1/facilities */
export const FacilitiesResponseSchema = z.object({
  examId: z.string(),
  items: z.array(FacilitySchema),
  source: DataSourceSchema,
});
export type FacilitiesResponse = z.infer<typeof FacilitiesResponseSchema>;

/** GET /v1/health */
export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  nfz: z.enum(['up', 'down']),
  snapshotAsOf: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/** POST /v1/call-assist — demo: an AI voice agent phones the clinic and asks for a visit */
export const CallAssistRequestSchema = z.object({
  examName: z.string().trim().min(1).max(80),
  facilityName: z.string().trim().min(1).max(120),
  forWhom: z.string().trim().min(1).max(40), // e.g. "mamę" (accusative, spoken by the agent)
  callerName: z.string().trim().min(1).max(40), // caregiver's first name, genitive ("Kasi")
  bookBy: ISODateSchema.optional(), // latest acceptable date from the plan
});
export type CallAssistRequest = z.infer<typeof CallAssistRequestSchema>;

export const CallAssistStartResponseSchema = z.object({
  callId: z.string(),
  mode: z.enum(['live', 'simulated']),
});
export type CallAssistStartResponse = z.infer<typeof CallAssistStartResponseSchema>;

export const CallAssistResultSchema = z.object({
  booked: z.boolean(),
  date: ISODateSchema.nullable(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  note: z.string().nullable(),
});
export type CallAssistResult = z.infer<typeof CallAssistResultSchema>;

/** GET /v1/call-assist/:callId */
export const CallAssistStatusSchema = z.object({
  callId: z.string(),
  status: z.enum(['queued', 'ringing', 'in_progress', 'ended', 'failed']),
  transcript: z.array(z.object({ role: z.enum(['agent', 'clinic']), text: z.string() })),
  result: CallAssistResultSchema.nullable(),
});
export type CallAssistStatus = z.infer<typeof CallAssistStatusSchema>;
