import { Hono } from 'hono';

import type { WaitTimeSummary } from '@naczas/shared';

import { errorResponse, LocationQuerySchema, originOf, validationMessage } from './common';
import { selectAdultQueues } from '../aggregate/normalize';
import { summarizeWaitTimes, toWaitSamples } from '../aggregate/wait-times';
import { benefitsForExam } from '../exam-benefits';

import type { QueueLoader } from '../queues';

export function waitTimesRoutes(loader: QueueLoader) {
  return new Hono().get('/wait-times', async (c) => {
    const parsed = LocationQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return errorResponse(c, 400, 'invalid_query', validationMessage(parsed.error));
    }
    const q = parsed.data;
    const benefits = benefitsForExam(q.examId);
    if (!benefits) {
      return errorResponse(c, 400, 'unknown_exam', `No NFZ queue data for examId "${q.examId}"`);
    }

    const origin = originOf(q);
    const loaded = await loader.load(q.province, benefits);
    const body: WaitTimeSummary = summarizeWaitTimes({
      examId: q.examId,
      province: q.province,
      samples: toWaitSamples(selectAdultQueues(loaded.queues, benefits), origin),
      hasOrigin: origin !== undefined,
      radiusKm: q.radiusKm,
      fallbackAsOf: loaded.fallbackMonth,
      source: loaded.source,
    });
    return c.json(body);
  });
}
