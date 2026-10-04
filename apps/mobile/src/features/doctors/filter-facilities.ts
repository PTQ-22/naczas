import type { Facility } from '@naczas/shared';

export type MaxDistance = 'any' | '10' | '25' | '50';
export type FacilityFeature = 'phone' | 'accessible' | 'parking';

export interface FacilityFilters {
  maxDistance: MaxDistance;
  features: readonly FacilityFeature[];
}

export const defaultFacilityFilters: FacilityFilters = { maxDistance: 'any', features: [] };

const hasFeature: Record<FacilityFeature, (f: Facility) => boolean> = {
  phone: (f) => !!f.phone?.trim(),
  // Step-free entrance: a ramp or a lift is what a wheelchair or a pram needs.
  accessible: (f) => f.accessibility.ramp || f.accessibility.elevator,
  parking: (f) => f.accessibility.parking,
};

/** Pure client-side filter over what the API returned; keeps the API's order. */
export function filterFacilities(items: readonly Facility[], filters: FacilityFilters): Facility[] {
  const maxKm = filters.maxDistance === 'any' ? Infinity : Number(filters.maxDistance);
  return items.filter(
    (f) => f.distanceKm <= maxKm && filters.features.every((feature) => hasFeature[feature](f)),
  );
}
