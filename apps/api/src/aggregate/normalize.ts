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

// "DZIECI" as a whole word (not "DZIECIĄTKA" — e.g. Szpital Dzieciątka Jezus treats adults),
// "DZIECIĘCEJ", "PEDIATRYCZNA".
const CHILDREN_PLACE = /DZIECI(?!\p{L})|DZIECIĘC|PEDIATR/iu;

/**
 * Children-only clinic, judged by the place name. NFZ flags don't work for this: in the WS2-1
 * fixtures `benefits-for-children: 'Y'` + `age-range` mark clinics that *also* treat children
 * (31% of adult ophthalmology), while e.g. "PORADNIA OKULISTYCZNA DLA DZIECI" has no flag at all.
 */
export function isChildrenOnlyPlace(queue: NfzQueue): boolean {
  return CHILDREN_PLACE.test(queue.attributes.place ?? '');
}

/** Records relevant for an adult user: exact benefit, no children-only clinics. */
export function selectAdultQueues(queues: NfzQueue[], benefits: readonly string[]): NfzQueue[] {
  return filterExactBenefits(queues, benefits).filter((q) => !isChildrenOnlyPlace(q));
}

/** average-period in days when > 0 (docs/03 change 2026-10-03), else null */
export function averageWaitDays(queue: NfzQueue): number | null {
  const days = queue.attributes.statistics?.['provider-data']?.['average-period'];
  return days != null && days > 0 ? days : null;
}

/** statistics.update ('YYYY-MM') when well-formed */
export function dataMonth(queue: NfzQueue): string | null {
  const month = queue.attributes.statistics?.['provider-data']?.update;
  return month && monthToIsoDate(month) ? month : null;
}

/**
 * NFZ queue → Facility. Returns null for records without coordinates: the contract requires
 * lat/lng, and such a place can be neither mapped nor radius-filtered.
 */
export function normalizeQueue(queue: NfzQueue, options: NormalizeOptions): Facility | null {
  const a = queue.attributes;
  if (a.latitude == null || a.longitude == null) return null;

  const stats = a.statistics?.['provider-data'];
  const month = dataMonth(queue);
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
    waitDays: averageWaitDays(queue),
    awaiting: stats?.awaiting ?? null,
    accessibility: {
      ramp: a.ramp === 'Y',
      elevator: a.elevator === 'Y',
      parking: a['car-park'] === 'Y',
      toilet: a.toilet === 'Y',
    },
    asOf: month ? `${month}-01` : options.fallbackAsOf,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
