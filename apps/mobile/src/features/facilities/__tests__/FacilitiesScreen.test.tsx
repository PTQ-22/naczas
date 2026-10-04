import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { FacilitiesParams } from '@/services';
import { createMockApi } from '@/services/api.mock';

import FacilitiesScreen from '../FacilitiesScreen';

// WS3's mock API serves real recorded /v1/facilities responses (woj. 07, Warszawa).
const recorded = createMockApi({ delayMs: 0 });

let mockExamId = 'colonoscopy_screening';
const mockGetFacilities = jest.fn();
jest.mock('@/services', () => ({
  api: { getFacilities: (...args: unknown[]) => mockGetFacilities(...args) as unknown },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ examId: mockExamId }),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// The map is covered by the list (same data); native maps can't render in Jest.
jest.mock('../FacilitiesMap', () => ({
  FacilitiesMap: () => null,
}));

// The first render in this file loads the facilities feature cold (map, formatters) and took
// 5–12 s under a full parallel `pnpm check` — over Jest's 5 s default, so it failed at random.
jest.setTimeout(20_000);

let openURL: jest.SpyInstance;

describe('FacilitiesScreen (no active profile → mock mama, Warszawa)', () => {
  beforeEach(() => {
    mockExamId = 'colonoscopy_screening';
    mockGetFacilities.mockReset();
    // Marked as snapshot so the "dane z kopii" info is exercised too.
    mockGetFacilities.mockImplementation(async (params: FacilitiesParams) => ({
      ...(await recorded.getFacilities(params)),
      source: 'nfz_snapshot',
    }));
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows skeletons first, then the rows with weeks of waiting and snapshot info', async () => {
    render(<FacilitiesScreen />);
    expect(screen.getAllByTestId('facility-skeleton')).toHaveLength(3);
    expect(await screen.findByText('Kolonoskopia — gdzie na NFZ')).toBeTruthy();
    await screen.findAllByText('tyg.');
    expect(screen.getByText('Dane z kopii NFZ, stan na 09.2026.')).toBeTruthy();
    expect(screen.queryByTestId('facility-skeleton')).toBeNull();
  });

  it('first card: primary call button dialling a tel: link; navigate opens maps', async () => {
    render(<FacilitiesScreen />);
    const calls = await screen.findAllByRole('link', { name: /^Zadzwoń do: / });
    fireEvent.press(calls[0]!);
    expect(openURL).toHaveBeenCalledWith(expect.stringMatching(/^tel:\+48\d{9}$/));
    fireEvent.press(screen.getAllByRole('link', { name: /^Nawiguj do: / })[0]!);
    expect(openURL).toHaveBeenLastCalledWith(expect.stringContaining('maps.apple.com'));
  });

  it('sort and view toggles are radio groups', async () => {
    render(<FacilitiesScreen />);
    await screen.findAllByText('tyg.');
    const nearest = screen.getByRole('radio', { name: 'Najbliżej' });
    fireEvent.press(nearest);
    await waitFor(() =>
      expect(
        screen.getByRole('radio', { name: 'Najbliżej' }).props.accessibilityState,
      ).toMatchObject({ selected: true }),
    );
    fireEvent.press(screen.getByRole('radio', { name: 'Mapa' }));
    await waitFor(() =>
      expect(screen.queryAllByRole('link', { name: /^Zadzwoń do: / })).toHaveLength(0),
    );
  });

  it('error state with retry', async () => {
    mockGetFacilities.mockReset().mockRejectedValue(new Error('offline'));
    render(<FacilitiesScreen />);
    expect(await screen.findByText('Nie udało się pobrać placówek')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    await waitFor(() => expect(mockGetFacilities).toHaveBeenCalledTimes(2));
  });

  it('empty state: none in the province (the API already widened the radius)', async () => {
    mockGetFacilities
      .mockReset()
      .mockResolvedValue({ examId: 'colonoscopy_screening', items: [], source: 'nfz_live' });
    render(<FacilitiesScreen />);
    expect(
      await screen.findByText('Brak placówek z tym badaniem w Twoim województwie'),
    ).toBeTruthy();
    expect(screen.queryByText(/^Pokazano/)).toBeNull();
  });

  it('asks without radiusKm and shows how many are shown and how far they reach (M3)', async () => {
    render(<FacilitiesScreen />);
    await screen.findAllByText('tyg.');
    const [params] = mockGetFacilities.mock.calls[0] as [Record<string, unknown>];
    expect(params).not.toHaveProperty('radiusKm');
    expect(
      screen.getByText(/^Pokazano: \d+, od najkrótszego czekania · do \d+ km od Ciebie$/),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Najbliżej' }));
    expect(await screen.findByText(/^Pokazano: \d+, od najbliższej · do \d+ km/)).toBeTruthy();
  });

  it('colonoscopy: explains queues are clinics and links the screening programme (L5)', async () => {
    render(<FacilitiesScreen />);
    expect(
      await screen.findByText(/^To kolejki NFZ do poradni\. W programie przesiewowym/),
    ).toBeTruthy();
    fireEvent.press(
      screen.getByRole('link', {
        name: 'Wyszukiwarka programów profilaktycznych NFZ, otwiera przeglądarkę',
      }),
    );
    expect(openURL).toHaveBeenCalledWith('https://gsl.nfz.gov.pl/GSL/GSL/ProgramyProfilaktyczne');
    // Let the list load so no state update lands after the test ends.
    await screen.findAllByText('tyg.');
  });

  it('queue exams without a programme get no programme note', async () => {
    mockExamId = 'eye_exam';
    render(<FacilitiesScreen />);
    await screen.findByText('Badanie u okulisty — gdzie na NFZ');
    expect(screen.queryByText(/^To kolejki NFZ do poradni/)).toBeNull();
    await screen.findAllByText('tyg.');
  });

  it('exams without an NFZ queue show an explanation instead of a list', () => {
    mockExamId = 'mammography';
    render(<FacilitiesScreen />);
    expect(screen.getByText('To badanie nie ma kolejki NFZ')).toBeTruthy();
  });
});
