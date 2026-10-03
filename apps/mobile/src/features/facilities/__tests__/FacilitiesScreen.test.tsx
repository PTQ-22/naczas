import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import FacilitiesScreen from '../FacilitiesScreen';

let mockExamId = 'colonoscopy_screening';
const mockConfig = { baseUrl: 'https://api.test', useMocks: true };
jest.mock('../api-config', () => ({ apiConfig: () => mockConfig }));
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

let openURL: jest.SpyInstance;

describe('FacilitiesScreen (no active profile → mock mama, Warszawa)', () => {
  beforeEach(() => {
    mockExamId = 'colonoscopy_screening';
    mockConfig.useMocks = true;
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows skeletons first, then the list with wait chips and snapshot info', async () => {
    render(<FacilitiesScreen />);
    expect(screen.getAllByTestId('facility-skeleton')).toHaveLength(3);
    expect(await screen.findByText('Kolonoskopia — gdzie na NFZ')).toBeTruthy();
    await screen.findAllByText(/^ok\. \d+ tyg\.$/);
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
    await screen.findAllByText(/^ok\. \d+ tyg\.$/);
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
    mockConfig.useMocks = false;
    const fetchMock = jest.fn(() => Promise.reject(new Error('offline')));
    global.fetch = fetchMock;
    render(<FacilitiesScreen />);
    expect(await screen.findByText('Nie udało się pobrać placówek')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('empty state offers a wider radius', async () => {
    mockConfig.useMocks = false;
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ examId: 'colonoscopy_screening', items: [], source: 'nfz_live' }),
      } as Response),
    );
    global.fetch = fetchMock;
    render(<FacilitiesScreen />);
    expect(await screen.findByText('Brak placówek w promieniu 25 km')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Szukaj w promieniu 50 km' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, [url]] = fetchMock.mock.calls as unknown as [[string], [string]];
    expect(new URL(url).searchParams.get('radiusKm')).toBe('50');
  });

  it('exams without an NFZ queue show an explanation instead of a list', () => {
    mockExamId = 'mammography';
    render(<FacilitiesScreen />);
    expect(screen.getByText('To badanie nie ma kolejki NFZ')).toBeTruthy();
  });
});
