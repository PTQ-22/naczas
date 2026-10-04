import type { Facility } from '@naczas/shared';

import { resetAllData } from '../actions';
import { facilityKey, pinDefaultFirst, useDefaultFacilityStore } from '../default-facility-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const make = (
  id: string,
  providerName: string,
  benefit = 'PORADNIA DERMATOLOGICZNA',
): Facility => ({
  id,
  benefit,
  providerName,
  placeName: 'Poradnia',
  address: 'ul. Prosta 1',
  locality: 'Warszawa',
  phone: '22 123 45 67',
  lat: 52.2,
  lng: 21,
  distanceKm: 3,
  firstAvailableDate: null,
  waitDays: 10,
  awaiting: 1,
  anesthesia: null,
  accessibility: { ramp: false, elevator: false, parking: false, toilet: false },
  asOf: '2026-09-01',
});

describe('facilityKey', () => {
  it('matches the same clinic across NFZ services, ignoring case and spacing', () => {
    const a = make('q1', 'PRZYCHODNIA  ZDROWIE');
    const b = { ...make('q2', 'Przychodnia Zdrowie', 'PORADNIA STOMATOLOGICZNA') };
    expect(facilityKey(a)).toBe(facilityKey(b));
  });

  it('differs between clinics', () => {
    expect(facilityKey(make('q1', 'A'))).not.toBe(facilityKey(make('q2', 'B')));
  });
});

describe('pinDefaultFirst', () => {
  const items = [make('1', 'A'), make('2', 'B'), make('3', 'C')];

  it('moves the default clinic to the top', () => {
    const key = facilityKey(items[2]!);
    expect(pinDefaultFirst(items, key).map((f) => f.id)).toEqual(['3', '1', '2']);
  });

  it('keeps the order without a default or when it is not in the list', () => {
    expect(pinDefaultFirst(items, null).map((f) => f.id)).toEqual(['1', '2', '3']);
    expect(pinDefaultFirst(items, 'nope').map((f) => f.id)).toEqual(['1', '2', '3']);
  });
});

describe('useDefaultFacilityStore', () => {
  beforeEach(() => useDefaultFacilityStore.getState().reset());

  it('stores only the clinic fields, keyed by provider + address, per profile', () => {
    const f = make('q1', 'Przychodnia A');
    useDefaultFacilityStore.getState().setDefault('p1', f);
    expect(useDefaultFacilityStore.getState().facilities['p1']).toEqual({
      key: facilityKey(f),
      providerName: 'Przychodnia A',
      address: 'ul. Prosta 1',
      locality: 'Warszawa',
      phone: '22 123 45 67',
      lat: 52.2,
      lng: 21,
    });
  });

  it('is cleared by "delete all data"', () => {
    useDefaultFacilityStore.getState().setDefault('p1', make('q1', 'A'));
    resetAllData();
    expect(useDefaultFacilityStore.getState().facilities).toEqual({});
  });
});
