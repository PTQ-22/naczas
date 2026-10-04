import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { simulateCallAssist, type CallAssistRequest } from '@naczas/shared';

import { useProfilesStore, useRecordsStore, useSettingsStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';
import { useAvailabilityStore } from '@/store/availability-store';

import CallAssistScreen from '../CallAssistScreen';

jest.mock('react-native-worklets', () =>
  jest.requireActual<object>('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  jest.requireActual<object>('react-native-reanimated/mock'),
);
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ examId: 'colonoscopy_screening', facility: 'Szpital Bielański' }),
  router: { back: jest.fn(), replace: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The API client is driven by the same scripted call the API simulates; the test controls time.
let mockElapsed = 0;
let mockRequest: CallAssistRequest | null = null;
const mockGetCallAssist = jest.fn();
jest.mock('@/services', () => ({
  api: {
    startCallAssist: (req: CallAssistRequest) => {
      mockRequest = req;
      return Promise.resolve({ callId: 'sim-1', mode: 'simulated' });
    },
    getCallAssist: (...args: unknown[]) => mockGetCallAssist(...args) as unknown,
  },
}));

const mama = makeProfile();
const kasia = makeProfile({ id: 'p-kasia', name: 'Kasia', relation: 'self' });

describe('CallAssistScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockElapsed = 0;
    mockRequest = null;
    mockGetCallAssist.mockImplementation(() =>
      Promise.resolve(simulateCallAssist('sim-1', mockRequest!, '2026-10-04', mockElapsed)),
    );
    act(() => {
      useSettingsStore.setState({ todayOverride: '2026-10-04' });
      useProfilesStore.setState({ profiles: [mama, kasia], activeProfileId: mama.id });
      useRecordsStore.setState({ records: [] });
      useAvailabilityStore.getState().reset();
    });
  });
  afterEach(() => jest.useRealTimers());

  it('asks for consent, then shows the call and books the visit when it ends', async () => {
    render(<CallAssistScreen />);
    expect(screen.getByText(/powie, że jest asystentem AI/)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Zadzwoń za mnie/ }));
      await Promise.resolve();
    });
    expect(mockRequest).toMatchObject({ forWhom: 'mamę', callerName: 'Kasi' });

    mockElapsed = 8000;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText(/asystentem AI dzwoniącym w imieniu Kasi/)).toBeTruthy();
    expect(useRecordsStore.getState().records).toEqual([]);

    mockElapsed = 30_000;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('19.10')).toBeTruthy();
    expect(useRecordsStore.getState().records).toEqual([
      expect.objectContaining({
        profileId: mama.id,
        examId: 'colonoscopy_screening',
        status: 'booked',
        bookedFor: '2026-10-19',
      }),
    ]);
  });

  it('passes the marked free hours to the agent, which books a slot that fits', async () => {
    act(() => {
      for (const weekday of [1, 2, 3, 4, 5] as const) {
        useAvailabilityStore.getState().addSlot(mama.id, {
          id: `w${weekday}`,
          repeat: 'weekly',
          weekday,
          from: '17:00',
          to: '20:00',
        });
      }
    });
    render(<CallAssistScreen />);
    expect(screen.getByText('↻ Pn–Pt 17:00–20:00')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Zadzwoń za mnie/ }));
      await Promise.resolve();
    });
    expect(mockRequest?.availability).toEqual({
      weekly: [{ days: [1, 2, 3, 4, 5], from: '17:00', to: '20:00' }],
      dates: [],
    });

    mockElapsed = 30_000;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(useRecordsStore.getState().records).toEqual([
      expect.objectContaining({ bookedFor: '2026-10-19', bookedTime: '17:00' }),
    ]);
  });

  it('offers a retry when the server is unreachable', async () => {
    mockGetCallAssist.mockRejectedValue(new Error('offline'));
    render(<CallAssistScreen />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Zadzwoń za mnie/ }));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeTruthy();
    expect(useRecordsStore.getState().records).toEqual([]);
  });
});
