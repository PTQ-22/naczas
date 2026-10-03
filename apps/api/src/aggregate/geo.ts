export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export const DEFAULT_RADIUS_KM = 15;
/** docs/05 §3: widen 15 → 30 → 60 → whole province until at least MIN_FACILITIES */
export const RADIUS_STEPS_KM = [15, 30, 60] as const;
export const MIN_FACILITIES = 3;

/** Radii to try, starting at the requested one, followed by the larger standard steps. */
export function radiusSteps(requestedKm: number): number[] {
  return [requestedKm, ...RADIUS_STEPS_KM.filter((step) => step > requestedKm)];
}
