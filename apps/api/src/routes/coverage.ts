import { Hono } from 'hono';
import { z } from 'zod';

import { CoverageProgramSchema, ProvinceCodeSchema, type Coverage } from '@naczas/shared';

import { errorResponse, validationMessage } from './common';
import { lookupCoverage, type CoverageData } from '../screening/data';

import type { CommuneResolver } from '../screening/uldk';

/** Privacy (AGENTS.md §8): ~1 km precision at most, whatever the client sends. */
const roundCoord = (n: number) => Math.round(n * 100) / 100;

const CoverageQuerySchema = z
  .object({
    program: CoverageProgramSchema,
    province: ProvinceCodeSchema.optional(),
    lat: z.coerce.number().min(-90).max(90).transform(roundCoord).optional(),
    lng: z.coerce.number().min(-180).max(180).transform(roundCoord).optional(),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'lat and lng must be given together',
    path: ['lat'],
  });

export function coverageRoutes(data: CoverageData, communes: CommuneResolver) {
  return new Hono().get('/coverage', async (c) => {
    const parsed = CoverageQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return errorResponse(c, 400, 'invalid_query', validationMessage(parsed.error));
    }
    const q = parsed.data;
    const teryt =
      q.lat !== undefined && q.lng !== undefined ? await communes.resolve(q.lat, q.lng) : undefined;
    const body: Coverage | undefined = lookupCoverage(data, q.program, {
      ...(teryt && { teryt }),
      ...(q.province && { province: q.province }),
    });
    if (!body) return errorResponse(c, 404, 'no_data', `No coverage data for ${q.program}`);
    // Static monthly data; area depends on the query, so cache per URL only in the client.
    c.header('Cache-Control', 'private, max-age=86400');
    return c.json(body);
  });
}
