import type { Facility, ProvinceCode, WaitTimeSummary } from '@naczas/shared';

import { MIN_FACILITIES, radiusSteps } from './geo';

/** Linear-interpolation percentile (p in 0..1) of an ascending array, rounded to whole days. */
export function percentile(sortedAsc: readonly number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  const pos = (sortedAsc.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const value = sortedAsc[lo]! + (sortedAsc[hi]! - sortedAsc[lo]!) * (pos - lo);
  return Math.round(value);
}

export interface SummarizeInput {
  examId: string;
  province: ProvinceCode;
  /** Normalized facilities of the province (distanceKm relative to the user when hasOrigin). */
  facilities: Facility[];
  hasOrigin: boolean;
  radiusKm: number;
  /** 'YYYY-MM' used when no facility has data */
  fallbackAsOf: string;
  source: WaitTimeSummary['source'];
}

/**
 * docs/05 §3: only facilities with a known wait count; widen the radius until at least
 * MIN_FACILITIES, finally the whole province. Without user coordinates → whole province.
 */
export function summarizeWaitTimes(input: SummarizeInput): WaitTimeSummary {
  const withData = input.facilities.filter((f) => f.waitDays != null);

  let used = withData;
  let radiusKm: number | null = null;
  if (input.hasOrigin) {
    for (const step of radiusSteps(input.radiusKm)) {
      const within = withData.filter((f) => f.distanceKm <= step);
      if (within.length >= MIN_FACILITIES) {
        used = within;
        radiusKm = step;
        break;
      }
    }
  }
  // Whole province: report the distance that actually covers the facilities used.
  radiusKm ??= input.hasOrigin ? Math.ceil(Math.max(0, ...used.map((f) => f.distanceKm))) : 0;

  const days = used.map((f) => f.waitDays!).sort((a, b) => a - b);
  const latestAsOf = used
    .map((f) => f.asOf.slice(0, 7))
    .sort()
    .at(-1);

  return {
    examId: input.examId,
    province: input.province,
    radiusKm,
    facilitiesCount: used.length,
    p50Days: percentile(days, 0.5),
    p75Days: percentile(days, 0.75),
    minDays: days[0] ?? null,
    asOf: latestAsOf ?? input.fallbackAsOf,
    source: input.source,
  };
}
