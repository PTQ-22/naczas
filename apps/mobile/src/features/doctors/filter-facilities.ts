import type { Facility } from '@naczas/shared';

export type MaxDistance = 'any' | '10' | '25' | '50';
export type FacilityFeature = 'phone' | 'ramp' | 'elevator' | 'parking' | 'toilet';

export interface FacilityFilters {
  maxDistance: MaxDistance;
  features: readonly FacilityFeature[];
}

export const defaultFacilityFilters: FacilityFilters = { maxDistance: 'any', features: [] };

const hasFeature: Record<FacilityFeature, (f: Facility) => boolean> = {
  phone: (f) => !!f.phone?.trim(),
  // Separate filters: a ramp and a lift are different needs (a pram vs. a wheelchair user on an
  // upper floor), and NFZ reports them as separate flags.
  ramp: (f) => f.accessibility.ramp,
  elevator: (f) => f.accessibility.elevator,
  parking: (f) => f.accessibility.parking,
  toilet: (f) => f.accessibility.toilet,
};

/** Pure client-side filter over what the API returned; keeps the API's order. */
export function filterFacilities(items: readonly Facility[], filters: FacilityFilters): Facility[] {
  const maxKm = filters.maxDistance === 'any' ? Infinity : Number(filters.maxDistance);
  return items.filter(
    (f) => f.distanceKm <= maxKm && filters.features.every((feature) => hasFeature[feature](f)),
  );
}
