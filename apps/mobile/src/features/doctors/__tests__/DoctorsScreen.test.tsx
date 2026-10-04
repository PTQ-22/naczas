import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { FacilitiesParams } from '@/services';
import { createMockApi } from '@/services/api.mock';

import DoctorsScreen from '../DoctorsScreen';

// WS3's mock API serves real recorded /v1/facilities responses (woj. 07, Warszawa).
const recorded = createMockApi({ delayMs: 0 });
const mockGetFacilities = jest.fn();
jest.mock('@/services', () => ({
  api: { getFacilities: (...args: unknown[]) => mockGetFacilities(...args) as unknown },
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// Native maps can't render in Jest; the list shows the same data.
jest.mock('@/features/facilities/FacilitiesMap', () => ({ FacilitiesMap: () => null }));

let openURL: jest.SpyInstance;

describe('DoctorsScreen (no active profile → mock mama, Warszawa)', () => {
  beforeEach(() => {
    mockGetFacilities.mockReset();
    mockGetFacilities.mockImplementation((params: FacilitiesParams) =>
      recorded.getFacilities(params),
    );
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('starts on the dentist, asks the API for 50 and lets the user call', async () => {
    render(<DoctorsScreen />);
    expect(screen.queryByText('Zadzwoń do lekarza')).toBeNull();
    const calls = await screen.findAllByRole('link', { name: /^Zadzwoń do: / });
    expect(mockGetFacilities).toHaveBeenCalledWith(
      expect.objectContaining({ examId: 'dental_checkup', limit: 50, sort: 'soonest' }),
      expect.anything(),
    );
    fireEvent.press(calls[0]!);
    expect(openURL).toHaveBeenCalledWith(expect.stringMatching(/^tel:/));
  });

  it('map starts compact and expands on demand', async () => {
    render(<DoctorsScreen />);
    await screen.findAllByText('tyg.', { includeHiddenElements: true });
    expect(screen.getByTestId('doctors-map')).toHaveStyle({ height: 130 });
    fireEvent.press(screen.getByRole('button', { name: 'Rozwiń mapę' }));
    expect(screen.getByTestId('doctors-map')).toHaveStyle({ height: 420 });
    fireEvent.press(screen.getByRole('button', { name: 'Zwiń mapę' }));
    expect(screen.getByTestId('doctors-map')).toHaveStyle({ height: 130 });
  });

  it('switching the specialty queries that exam, regardless of the plan', async () => {
    render(<DoctorsScreen />);
    await screen.findAllByText('tyg.', { includeHiddenElements: true });
    fireEvent.press(screen.getByTestId('doctors-filters-button'));
    fireEvent.press(screen.getByRole('radio', { name: 'Specjalista: Neurolog' }));
    // Only the request matters here: the recorded fixtures don't cover every specialty.
    await waitFor(() =>
      expect(mockGetFacilities).toHaveBeenLastCalledWith(
        expect.objectContaining({ examId: 'neurolog' }),
        expect.anything(),
      ),
    );
  });

  it('filters narrow the list; an empty result offers to clear them', async () => {
    render(<DoctorsScreen />);
    await screen.findAllByText('tyg.', { includeHiddenElements: true });
    expect(screen.getByText(/^Dentysta · pasuje: (\d+) z \1$/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('doctors-filters-button'));
    fireEvent.press(screen.getByRole('radio', { name: 'Odległość: do 10 km' }));
    for (const name of ['Ma telefon', 'Podjazd', 'Winda', 'Parking', 'Toaleta']) {
      fireEvent.press(screen.getByRole('checkbox', { name: `Udogodnienia: ${name}` }));
    }
    fireEvent.press(screen.getByTestId('doctors-filters-apply'));
    // The button counts the narrowing filters: distance + five amenities.
    expect(screen.getByRole('button', { name: /^Filtry \(6\)/ })).toBeTruthy();
    const summary = screen.getByText(/pasuje: \d+ z \d+$/);
    const [, count, total] = /(\d+) z (\d+)/.exec(String(summary.props.children)) ?? [];
    expect(Number(count)).toBeLessThan(Number(total));
    if (Number(count) === 0) {
      fireEvent.press(screen.getByRole('button', { name: 'Wyczyść filtry' }));
      expect(screen.getByText(/pasuje: (\d+) z \1$/)).toBeTruthy();
    }
  });
});
