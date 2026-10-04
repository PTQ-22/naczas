import { z } from 'zod';

import { CallAvailabilitySchema } from './availability';
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

/** Re-dial policy when nobody answers (no answer, busy, voicemail). */
export const CallRetrySchema = z.object({
  maxAttempts: z.number().int().min(1).max(5),
  /** Minutes between attempts; attempts happen only in clinic hours (Mon–Fri 7:30–18:00). */
  intervalMin: z.number().int().min(1).max(120),
});
export type CallRetry = z.infer<typeof CallRetrySchema>;
export const DEFAULT_CALL_RETRY: CallRetry = { maxAttempts: 3, intervalMin: 10 };

/** POST /v1/call-assist — demo: an AI voice agent phones the clinic and asks for a visit */
/**
 * Personal data the patient explicitly allowed the agent to say (Settings → "Dane w rozmowach AI",
 * every field off by default). The agent gives a field only when the clinic asks for it.
 */
export const CallPatientDetailsSchema = z.object({
  firstName: z.string().trim().min(1).max(40).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  pesel: z
    .string()
    .regex(/^\d{11}$/)
    .optional(),
  birthDate: ISODateSchema.optional(),
  phone: z.string().trim().min(5).max(20).optional(),
  address: z.string().trim().min(3).max(120).optional(),
});
export type CallPatientDetails = z.infer<typeof CallPatientDetailsSchema>;

export const CallAssistRequestSchema = z.object({
  examName: z.string().trim().min(1).max(80),
  facilityName: z.string().trim().min(1).max(120),
  forWhom: z.string().trim().min(1).max(40), // e.g. "mamę" (accusative, spoken by the agent)
  callerName: z.string().trim().min(1).max(40), // caregiver's first name, genitive ("Kasi")
  bookBy: ISODateSchema.optional(), // latest acceptable date from the plan
  availability: CallAvailabilitySchema.optional(), // when the patient can come; absent = any time
  retry: CallRetrySchema.optional(), // absent = DEFAULT_CALL_RETRY
  patientDetails: CallPatientDetailsSchema.optional(), // only fields the user opted in to
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
  /**
   * on_hold = answered, waiting on the line (IVR / hold music) until the clinic speaks;
   * retry_scheduled = nobody answered, the next attempt is at `attempt.nextAt`.
   */
  status: z.enum([
    'queued',
    'ringing',
    'on_hold',
    'in_progress',
    'retry_scheduled',
    'ended',
    'failed',
    'cancelled',
  ]),
  transcript: z.array(z.object({ role: z.enum(['agent', 'clinic']), text: z.string() })),
  result: CallAssistResultSchema.nullable(),
  /** Which attempt this is; optional for older API versions. */
  attempt: z
    .object({
      number: z.number().int().min(1),
      max: z.number().int().min(1),
      /** ISO date-time of the next attempt while `retry_scheduled`, else null */
      nextAt: z.string().nullable(),
    })
    .optional(),
  /** Phone time the agent spent instead of the user, over all attempts so far. */
  stats: z
    .object({
      attempts: z.number().int().min(0),
      /** Ringing + waiting on the line until the clinic spoke */
      waitedSec: z.number().min(0),
      /** Talking with the clinic */
      talkedSec: z.number().min(0),
    })
    .optional(),
});
export type CallAssistStatus = z.infer<typeof CallAssistStatusSchema>;
