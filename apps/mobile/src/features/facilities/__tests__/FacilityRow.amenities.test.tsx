import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Facility } from '@naczas/shared';

import { FacilityRow } from '../FacilityRow';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const facility: Facility = {
  id: 'q1',
  benefit: 'PORADNIA DERMATOLOGICZNA',
  providerName: 'PRZYCHODNIA A',
  placeName: 'PRZYCHODNIA A',
  address: 'UL. PROSTA 1',
  locality: 'WARSZAWA',
  phone: '22 123 45 67',
  lat: 52.2,
  lng: 21,
  distanceKm: 5,
  firstAvailableDate: null,
  waitDays: 30,
  awaiting: 10,
  anesthesia: null,
  accessibility: { ramp: true, elevator: false, parking: true, toilet: true },
  asOf: '2026-09-01',
};

describe('FacilityRow amenities', () => {
  it('hides parking, ramp and toilet until "⋯" is pressed', () => {
    render(<FacilityRow facility={facility} examId="dermatolog" sort="soonest" />);
    expect(screen.queryByTestId('facility-amenities')).toBeNull();
    expect(screen.queryByText(/podjazd/)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: /Więcej/ }));
    expect(screen.getByTestId('facility-amenities')).toHaveTextContent(
      'Udogodnienia: podjazd · parking · toaleta',
    );
  });

  it('says so when NFZ reports no amenities', () => {
    const none = {
      ...facility,
      accessibility: { ramp: false, elevator: false, parking: false, toilet: false },
    };
    render(<FacilityRow facility={none} examId="dermatolog" sort="soonest" />);
    fireEvent.press(screen.getByRole('button', { name: /Więcej/ }));
    expect(screen.getByTestId('facility-amenities')).toHaveTextContent(
      'Brak danych o udogodnieniach',
    );
  });
});
