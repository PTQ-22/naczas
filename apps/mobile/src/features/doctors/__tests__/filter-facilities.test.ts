import { rules } from '@naczas/rules';
import type { Facility } from '@naczas/shared';

import { defaultFacilityFilters, filterFacilities } from '../filter-facilities';
import { SPECIALTY_EXAM_IDS } from '../specialties';

const base: Facility = {
  id: 'q1',
  benefit: 'PORADNIA DERMATOLOGICZNA',
  providerName: 'Przychodnia A',
  placeName: 'Poradnia',
  address: 'ul. Prosta 1',
  locality: 'Warszawa',
  phone: '+48 22 123 45 67',
  lat: 52.2,
  lng: 21,
  distanceKm: 5,
  firstAvailableDate: null,
  waitDays: 30,
  awaiting: 10,
  anesthesia: null,
  accessibility: { ramp: false, elevator: false, parking: false, toilet: false },
  asOf: '2026-09-01',
};

const far: Facility = { ...base, id: 'far', distanceKm: 40, phone: null };
const ramp: Facility = {
  ...base,
  id: 'ramp',
  distanceKm: 12,
  accessibility: { ...base.accessibility, ramp: true, parking: true },
};
const lift: Facility = {
  ...base,
  id: 'lift',
  accessibility: { ...base.accessibility, elevator: true },
};
const items = [base, far, ramp, lift];
const ids = (list: Facility[]) => list.map((f) => f.id);

describe('filterFacilities', () => {
  it('keeps everything with default filters, in API order', () => {
    expect(ids(filterFacilities(items, defaultFacilityFilters))).toEqual([
      'q1',
      'far',
      'ramp',
      'lift',
    ]);
  });

  it('drops facilities beyond the max distance', () => {
    expect(ids(filterFacilities(items, { maxDistance: '10', features: [] }))).toEqual([
      'q1',
      'lift',
    ]);
    expect(ids(filterFacilities(items, { maxDistance: '50', features: [] }))).toHaveLength(4);
  });

  it('phone: only facilities with a phone number', () => {
    expect(ids(filterFacilities(items, { maxDistance: 'any', features: ['phone'] }))).not.toContain(
      'far',
    );
  });

  it('accessible: a ramp or a lift', () => {
    expect(ids(filterFacilities(items, { maxDistance: 'any', features: ['accessible'] }))).toEqual([
      'ramp',
      'lift',
    ]);
  });

  it('combines features with AND', () => {
    expect(
      ids(filterFacilities(items, { maxDistance: '25', features: ['accessible', 'parking'] })),
    ).toEqual(['ramp']);
  });
});

describe('SPECIALTY_EXAM_IDS', () => {
  it('lists only exams with an NFZ queue, one per benefit', () => {
    const listed = SPECIALTY_EXAM_IDS.map((id) => rules.find((r) => r.id === id));
    for (const rule of listed) expect(rule?.booking).toBe('queue');
    const benefits = listed.map((r) => r?.nfzBenefits?.join('|'));
    expect(new Set(benefits).size).toBe(benefits.length);
  });
});
