import { Hono } from 'hono';
import { z } from 'zod';

import type { FacilitiesResponse, Facility } from '@naczas/shared';

import { errorResponse, LocationQuerySchema, originOf, validationMessage } from './common';
import { MIN_FACILITIES, radiusSteps } from '../aggregate/geo';
import { selectAdultQueues, normalizeQueue } from '../aggregate/normalize';
import { benefitsForExam } from '../exam-benefits';

import type { QueueLoader } from '../queues';

const FacilitiesQuerySchema = LocationQuerySchema.and(
  z.object({
    sort: z.enum(['soonest', 'nearest']).default('soonest'),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
);

/** soonest = shortest average wait first (docs/03 change 2026-10-03), unknown waits last */
const bySoonest = (a: Facility, b: Facility) =>
  (a.waitDays ?? Infinity) - (b.waitDays ?? Infinity) || a.distanceKm - b.distanceKm;
const byNearest = (a: Facility, b: Facility) => a.distanceKm - b.distanceKm;

/** Same widening as wait-times: smallest radius step with at least MIN_FACILITIES, else all. */
function withinRadius(facilities: Facility[], radiusKm: number): Facility[] {
  for (const step of radiusSteps(radiusKm)) {
    const within = facilities.filter((f) => f.distanceKm <= step);
    if (within.length >= MIN_FACILITIES) return within;
  }
  return facilities;
}

export function facilitiesRoutes(loader: QueueLoader) {
  return new Hono().get('/facilities', async (c) => {
    const parsed = FacilitiesQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return errorResponse(c, 400, 'invalid_query', validationMessage(parsed.error));
    }
    const q = parsed.data;
    const origin = originOf(q);
    if (q.sort === 'nearest' && !origin) {
      return errorResponse(c, 400, 'invalid_query', 'sort=nearest requires lat and lng');
    }
    const benefits = benefitsForExam(q.examId);
    if (!benefits) {
      return errorResponse(c, 400, 'unknown_exam', `No NFZ queue data for examId "${q.examId}"`);
    }

    const loaded = await loader.load(q.province, benefits);
    const all = selectAdultQueues(loaded.queues, benefits)
      .map((queue) => normalizeQueue(queue, { origin, fallbackAsOf: `${loaded.fallbackMonth}-01` }))
      .filter((f) => f !== null);
    const candidates = origin ? withinRadius(all, q.radiusKm) : all;

    const body: FacilitiesResponse = {
      examId: q.examId,
      items: candidates.sort(q.sort === 'nearest' ? byNearest : bySoonest).slice(0, q.limit),
      source: loaded.source,
    };
    return c.json(body);
  });
}
