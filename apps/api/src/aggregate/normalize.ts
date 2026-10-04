import type { Facility } from '@naczas/shared';

import { haversineKm, type LatLng } from './geo';
import { parsePcusDays } from './pcus';

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

/**
 * One facility's wait in days, best source first:
 * 1. v1.4 `dates.pcus` — NFZ's daily forecast for a new patient (when `applicable`);
 * 2. monthly `average-period` (days) when > 0;
 * 3. `average-period: 0` with `awaiting: 0` — nobody waits, so no queue (0 days).
 * Otherwise null: `average-period: 0` with people waiting means NFZ has no statistic.
 */
export function waitDaysOf(queue: NfzQueue): number | null {
  const dates = queue.attributes.dates;
  if (dates?.applicable === true) {
    const pcus = parsePcusDays(dates.pcus);
    if (pcus !== null) return pcus;
  }
  const stats = queue.attributes.statistics?.['provider-data'];
  const average = stats?.['average-period'];
  if (average != null && average > 0) return average;
  if (average === 0 && stats?.awaiting === 0) return 0;
  return null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** v1.4 `dates.date-situation-as-at` ('YYYY-MM-DD') when well-formed */
export function situationDate(queue: NfzQueue): string | null {
  const date = queue.attributes.dates?.['date-situation-as-at'];
  return date && ISO_DATE.test(date) ? date : null;
}

/** statistics.update ('YYYY-MM') when well-formed */
export function statisticsMonth(queue: NfzQueue): string | null {
  const month = queue.attributes.statistics?.['provider-data']?.update;
  return month && monthToIsoDate(month) ? month : null;
}

/** 'YYYY-MM' of the record's data: the daily situation date, else the statistics month. */
export function dataMonth(queue: NfzQueue): string | null {
  return situationDate(queue)?.slice(0, 7) ?? statisticsMonth(queue);
}

/** NFZ 'Y'/'N' → boolean; anything else (missing, '') → null */
function yesNo(value: string | null | undefined): boolean | null {
  return value === 'Y' ? true : value === 'N' ? false : null;
}

/**
 * NFZ queue → Facility. Returns null for records without coordinates: the contract requires
 * lat/lng, and such a place can be neither mapped nor radius-filtered.
 */
export function normalizeQueue(queue: NfzQueue, options: NormalizeOptions): Facility | null {
  const a = queue.attributes;
  if (a.latitude == null || a.longitude == null) return null;

  const stats = a.statistics?.['provider-data'];
  const month = statisticsMonth(queue);
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
    // ITL gives no first free date (v1.3: dates null, v1.4: only a pcus forecast) — docs/03.
    firstAvailableDate: null,
    waitDays: waitDaysOf(queue),
    awaiting: stats?.awaiting ?? null,
    anesthesia: yesNo(a.anesthesia),
    accessibility: {
      ramp: a.ramp === 'Y',
      elevator: a.elevator === 'Y',
      parking: a['car-park'] === 'Y',
      toilet: a.toilet === 'Y',
    },
    asOf: situationDate(queue) ?? (month ? `${month}-01` : options.fallbackAsOf),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
