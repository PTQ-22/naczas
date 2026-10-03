import type { ProvinceCode, WaitTimeSummary } from '@naczas/shared';

import { haversineKm, MIN_FACILITIES, radiusSteps, type LatLng } from './geo';
import { averageWaitDays, dataMonth } from './normalize';

import type { NfzQueue } from '../nfz/schemas';

/** Linear-interpolation percentile (p in 0..1) of an ascending array, rounded to whole days. */
export function percentile(sortedAsc: readonly number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  const pos = (sortedAsc.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const value = sortedAsc[lo]! + (sortedAsc[hi]! - sortedAsc[lo]!) * (pos - lo);
  return Math.round(value);
}

/** One facility's contribution to the aggregate. Unlike Facility it may lack coordinates. */
export interface WaitSample {
  waitDays: number;
  /** null when the facility has no coordinates or the user gave none */
  distanceKm: number | null;
  /** 'YYYY-MM' or null */
  month: string | null;
}

/** Queues → samples; facilities without a known wait (average-period ≤ 0 / null) are left out. */
export function toWaitSamples(queues: NfzQueue[], origin?: LatLng): WaitSample[] {
  return queues.flatMap((q) => {
    const waitDays = averageWaitDays(q);
    if (waitDays === null) return [];
    const { latitude, longitude } = q.attributes;
    const distanceKm =
      origin && latitude != null && longitude != null
        ? // rounded like Facility.distanceKm, so list and aggregate agree at the radius boundary
          Math.round(haversineKm(origin, { lat: latitude, lng: longitude }) * 10) / 10
        : null;
    return [{ waitDays, distanceKm, month: dataMonth(q) }];
  });
}

export interface SummarizeInput {
  examId: string;
  province: ProvinceCode;
  samples: WaitSample[];
  hasOrigin: boolean;
  radiusKm: number;
  /** 'YYYY-MM' used when no sample has a month */
  fallbackAsOf: string;
  source: WaitTimeSummary['source'];
}

/**
 * docs/05 §3: widen the radius until at least MIN_FACILITIES, finally the whole province.
 * Samples without coordinates only drop out of the radius steps — the whole-province aggregate
 * (also used when the user gave no coordinates) counts them.
 */
export function summarizeWaitTimes(input: SummarizeInput): WaitTimeSummary {
  let used = input.samples;
  let radiusKm: number | null = null;
  if (input.hasOrigin) {
    const located = input.samples.filter((s) => s.distanceKm !== null);
    for (const step of radiusSteps(input.radiusKm)) {
      const within = located.filter((s) => s.distanceKm! <= step);
      if (within.length >= MIN_FACILITIES) {
        used = within;
        radiusKm = step;
        break;
      }
    }
    // Whole province: report the distance that covers every located facility.
    radiusKm ??= Math.ceil(Math.max(0, ...located.map((s) => s.distanceKm!)));
  }

  const days = used.map((s) => s.waitDays).sort((a, b) => a - b);
  const latestMonth = used
    .map((s) => s.month)
    .filter((m) => m !== null)
    .sort()
    .at(-1);

  return {
    examId: input.examId,
    province: input.province,
    radiusKm: radiusKm ?? 0,
    facilitiesCount: used.length,
    p50Days: percentile(days, 0.5),
    p75Days: percentile(days, 0.75),
    minDays: days[0] ?? null,
    asOf: latestMonth ?? input.fallbackAsOf,
    source: input.source,
  };
}
