import { readFileSync } from 'node:fs';
import path from 'node:path';

import { z } from 'zod';

import type { NfzQueue } from './schemas';

/**
 * ITL v1.4 returns latitude/longitude = null for ~95% of records (checked 2026-10-04), while
 * v1.3 still has them. data/geo/places.json maps a place's address to the v1.3 coordinates
 * (scripts/geo-index.ts) so v1.4 records can still be mapped and radius-filtered.
 * Keyed by address, not queue id: ids differ between the two API versions.
 */
export const GeoIndexSchema = z.record(z.string(), z.tuple([z.number(), z.number()]));
export type GeoIndex = z.infer<typeof GeoIndexSchema>;

const norm = (s: string | null | undefined) => (s ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
// v1.3 writes "UL. WODNIKA 57" where v1.4 has "WODNIKA 57" — compare without the street type.
const STREET_TYPE = /^(?:(?:UL|AL|PL|OS|ULICA|ALEJA|ALEJE|PLAC|OSIEDLE)\.?\s+)+/;

/** 'LOCALITY|ADDRESS' (normalized), or null when either part is missing */
export function addressKey(
  locality: string | null | undefined,
  address: string | null | undefined,
) {
  const loc = norm(locality);
  const addr = norm(address).replace(STREET_TYPE, '');
  return loc && addr ? `${loc}|${addr}` : null;
}

export const placeKey = (queue: NfzQueue): string | null =>
  addressKey(queue.attributes.locality, queue.attributes.address);

/** Fills missing coordinates from the index; records with their own coordinates are kept. */
export function withCoordinates(queues: NfzQueue[], index: GeoIndex): NfzQueue[] {
  return queues.map((q) => {
    if (q.attributes.latitude != null && q.attributes.longitude != null) return q;
    const key = placeKey(q);
    const hit = key ? index[key] : undefined;
    if (!hit) return q;
    const [latitude, longitude]: [number, number] = hit;
    return { ...q, attributes: { ...q.attributes, latitude, longitude } };
  });
}

/** Committed index built by scripts/geo-index.ts */
export const GEO_INDEX_FILE = path.resolve(import.meta.dirname, '../../data/geo/places.json');

/** Missing or broken file → empty index: records without coordinates just stay unmapped. */
export function loadGeoIndex(file: string): GeoIndex {
  try {
    const parsed = GeoIndexSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
    if (!parsed.success) return {};
    // Re-key so an index written with older normalization still matches.
    const index: GeoIndex = {};
    for (const [key, coords] of Object.entries(parsed.data)) {
      const [locality, address] = key.split('|');
      const k = addressKey(locality, address);
      if (k && !index[k]) index[k] = coords;
    }
    return index;
  } catch {
    return {};
  }
}
