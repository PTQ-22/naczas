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
  asOf: z.string(), // 'YYYY-MM' from NFZ statistics.update
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
  waitDays: z.number().nullable(), // firstAvailableDate − asOf
  awaiting: z.number().nullable(), // statistics.provider-data.awaiting
  accessibility: z.object({
    ramp: z.boolean(),
    elevator: z.boolean(),
    parking: z.boolean(),
    toilet: z.boolean(),
  }),
  asOf: ISODateSchema, // dates.date-situation-as-at
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
