import type { Facility } from '@naczas/shared';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
}

/** ~50 m: several NFZ "places" of one provider often share the exact same coordinates. */
export const OVERLAP_DEG = 0.0005;
/** Spread radius, ~250 m — enough to separate markers at city zoom, small enough to stay honest. */
export const SPREAD_DEG = 0.0025;

/**
 * Marker positions with overlapping facilities moved apart on a small circle around their shared
 * spot. Deterministic (input order), so markers don't jump between renders. Clustering would need
 * a new dependency; with ≤ 20 markers a spread is enough.
 */
export function spreadOverlapping(
  facilities: Pick<Facility, 'id' | 'lat' | 'lng'>[],
  overlapDeg = OVERLAP_DEG,
  spreadDeg = SPREAD_DEG,
): MapPoint[] {
  const groups: { lat: number; lng: number; ids: string[] }[] = [];
  for (const f of facilities) {
    const group = groups.find(
      (g) => Math.abs(g.lat - f.lat) <= overlapDeg && Math.abs(g.lng - f.lng) <= overlapDeg,
    );
    if (group) group.ids.push(f.id);
    else groups.push({ lat: f.lat, lng: f.lng, ids: [f.id] });
  }
  return groups.flatMap(({ lat, lng, ids }) => {
    if (ids.length === 1) return [{ id: ids[0]!, lat, lng }];
    // Longitude degrees shrink with latitude; scale so the spread looks circular on the map.
    const lngScale = 1 / Math.cos((lat * Math.PI) / 180);
    return ids.map((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length;
      return {
        id,
        lat: lat + spreadDeg * Math.sin(angle),
        lng: lng + spreadDeg * lngScale * Math.cos(angle),
      };
    });
  });
}

/** South-west and north-east corners covering every point (facilities + the user's area). */
export function boundsOf(points: { lat: number; lng: number }[]): {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
} | null {
  if (!points.length) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    sw: { lat: Math.min(...lats), lng: Math.min(...lngs) },
    ne: { lat: Math.max(...lats), lng: Math.max(...lngs) },
  };
}
