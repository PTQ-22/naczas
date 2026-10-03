import { z } from 'zod';

import { ProvinceCodeSchema } from '@naczas/shared';

import { DEFAULT_RADIUS_KM } from '../aggregate/geo';

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
) {
  return c.json({ error: { code, message } }, status);
}

/** Privacy (AGENTS.md §8): never work with more than ~1 km precision, even if a client sends more. */
const roundCoord = (n: number) => Math.round(n * 100) / 100;

export const LocationQuerySchema = z
  .object({
    examId: z.string().min(1),
    province: ProvinceCodeSchema,
    lat: z.coerce.number().min(-90).max(90).transform(roundCoord).optional(),
    lng: z.coerce.number().min(-180).max(180).transform(roundCoord).optional(),
    radiusKm: z.coerce.number().positive().max(300).default(DEFAULT_RADIUS_KM),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'lat and lng must be given together',
    path: ['lat'],
  });

export function validationMessage(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || 'query'}: ${i.message}`).join('; ');
}

export function originOf(q: { lat?: number | undefined; lng?: number | undefined }) {
  return q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : undefined;
}
