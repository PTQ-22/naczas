import type { Facility } from '@naczas/shared';

import { haversineKm, type LatLng } from './geo';

import type { NfzQueue } from '../nfz/schemas';

export interface NormalizeOptions {
  /** User position (rounded by the client); without it distanceKm is 0. */
  origin?: LatLng | undefined;
  /** 'YYYY-MM-DD' used when a record has no statistics.update */
  fallbackAsOf: string;
}

/** 'YYYY-MM' → 'YYYY-MM-01' (contract: Facility.asOf is an ISODate) */
export function monthToIsoDate(month: string): string | null {
  return /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : null;
}

/** Keeps only records of exactly these benefits — NFZ filters `benefit` by prefix. */
export function filterExactBenefits(queues: NfzQueue[], benefits: readonly string[]): NfzQueue[] {
  const wanted = new Set(benefits);
  return queues.filter((q) => wanted.has(q.attributes.benefit));
}

/**
 * NFZ queue → Facility. Returns null for records without coordinates: the contract requires
 * lat/lng, and such a place can be neither mapped nor radius-filtered.
 */
export function normalizeQueue(queue: NfzQueue, options: NormalizeOptions): Facility | null {
  const a = queue.attributes;
  if (a.latitude == null || a.longitude == null) return null;

  const stats = a.statistics?.['provider-data'];
  const averagePeriod = stats?.['average-period'];
  const position = { lat: a.latitude, lng: a.longitude };

  return {
    id: queue.id,
    benefit: a.benefit,
    providerName: a.provider ?? '',
    placeName: a.place ?? '',
    address: a.address ?? '',
    locality: a.locality ?? '',
    phone: a.phone?.trim() ? a.phone.trim() : null,
    lat: position.lat,
    lng: position.lng,
    distanceKm: options.origin ? round1(haversineKm(options.origin, position)) : 0,
    // NFZ returns dates: null for every record (WS2-1) — docs/03 change 2026-10-03.
    firstAvailableDate: null,
    waitDays: averagePeriod != null && averagePeriod > 0 ? averagePeriod : null,
    awaiting: stats?.awaiting ?? null,
    accessibility: {
      ramp: a.ramp === 'Y',
      elevator: a.elevator === 'Y',
      parking: a['car-park'] === 'Y',
      toilet: a.toilet === 'Y',
    },
    asOf: (stats?.update && monthToIsoDate(stats.update)) || options.fallbackAsOf,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
