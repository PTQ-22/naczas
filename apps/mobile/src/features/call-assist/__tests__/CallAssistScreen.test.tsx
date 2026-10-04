import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  createSimulatedCallTask,
  simulateCallAssist,
  simulatedCallStatus,
  type CallAssistRequest,
} from '@naczas/shared';

import { useCallTasksStore, useProfilesStore, useRecordsStore, useSettingsStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';
import { useAvailabilityStore } from '@/store/availability-store';

import CallAssistScreen from '../CallAssistScreen';
import { CallTasksSync } from '../CallTasksSync';

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
const mockStart = jest.fn();
const mockRetryNow = jest.fn();
jest.mock('@/services', () => ({
  api: {
    startCallAssist: (req: CallAssistRequest) => {
      mockRequest = req;
      return mockStart(req) as unknown;
    },
    getCallAssist: (...args: unknown[]) => mockGetCallAssist(...args) as unknown,
    retryCallAssistNow: (...args: unknown[]) => mockRetryNow(...args) as unknown,
    cancelCallAssist: jest.fn(),
  },
}));

// The screen shows the task; the app-wide poller (mounted in the root layout) moves it on.
const renderScreen = () =>
  render(
    <>
      <CallAssistScreen />
      <CallTasksSync />
    </>,
  );
const tick = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(2000);
  });

const mama = makeProfile();
const kasia = makeProfile({ id: 'p-kasia', name: 'Kasia', relation: 'self' });

describe('CallAssistScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockElapsed = 0;
    mockRequest = null;
    mockStart.mockReset();
    mockStart.mockResolvedValue({ callId: 'sim-1', mode: 'simulated' });
    mockRetryNow.mockReset();
    mockGetCallAssist.mockReset();
    mockGetCallAssist.mockImplementation(() =>
      Promise.resolve(simulateCallAssist('sim-1', mockRequest!, '2026-10-04', mockElapsed)),
    );
    act(() => {
      useSettingsStore.setState({ todayOverride: '2026-10-04' });
      useProfilesStore.setState({ profiles: [mama, kasia], activeProfileId: mama.id });
      useRecordsStore.setState({ records: [] });
      useAvailabilityStore.getState().reset();
      useCallTasksStore.getState().reset();
    });
  });
  afterEach(() => jest.useRealTimers());

  it('asks for consent, then shows the call and books the visit when it ends', async () => {
    renderScreen();
    expect(screen.getByText(/powie, że jest asystentem AI/)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Zadzwoń za mnie/ }));
      await Promise.resolve();
    });
    expect(mockRequest).toMatchObject({ forWhom: 'mamę', callerName: 'Kasi' });

    mockElapsed = 5000; // mid-call (the simulation runs 3× faster than a real call)
    await tick();
    expect(screen.getByText(/asystentem AI dzwoniącym w imieniu Kasi/)).toBeTruthy();
    expect(useRecordsStore.getState().records).toEqual([]);

    mockElapsed = 60_000;
    await tick();
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
    renderScreen();
    expect(screen.getByText('↻ Pn–Pt 17:00–20:00')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Zadzwoń za mnie/ }));
      await Promise.resolve();
    });
    expect(mockRequest?.availability).toEqual({
      weekly: [{ days: [1, 2, 3, 4, 5], from: '17:00', to: '20:00' }],
      dates: [],
    });

    mockElapsed = 60_000;
    await tick();
    expect(useRecordsStore.getState().records).toEqual([
      expect.objectContaining({ bookedFor: '2026-10-19', bookedTime: '17:00' }),
    ]);
  });

  it('offers a retry when the server is unreachable', async () => {
    mockStart.mockRejectedValue(new Error('offline'));
    renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Zadzwoń za mnie/ }));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole('button', { name: /Zadzwoń za mnie/ })).toBeTruthy();
    expect(screen.getByText(/Nie udało się połączyć z serwerem/)).toBeTruthy();
    expect(useRecordsStore.getState().records).toEqual([]);
  });

  it('nobody answers: shows the retry countdown and "Zadzwoń teraz" dials again', async () => {
    const t0 = Date.now();
    const task = createSimulatedCallTask(
      { examName: 'x', facilityName: 'y', forWhom: 'mamę', callerName: 'Kasi' },
      '2026-10-04',
      t0 - 3000, // first attempt already rang out (at 2 s; retry at ~4.7 s)
    );
    mockGetCallAssist.mockImplementation(() =>
      Promise.resolve(simulatedCallStatus('sim-1', task, Date.now())),
    );
    mockRetryNow.mockResolvedValue({
      ...simulatedCallStatus('sim-1', task, t0),
      status: 'ringing',
      attempt: { number: 2, max: 3, nextAt: null },
    });
    renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Zadzwoń za mnie/ }));
      await Promise.resolve();
    });
    await tick();
    expect(screen.getByTestId('call-status').props.children).toMatch(
      /NIKT NIE ODEBRAŁ · PONOWIĘ ZA/,
    );
    expect(screen.getByTestId('call-stats').props.children).toBe(
      'Próby: 1 · na linii 0:02 · rozmowa 0:00',
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('call-retry-now'));
      await Promise.resolve();
    });
    expect(mockRetryNow).toHaveBeenCalledWith('sim-1');
    expect(screen.getByTestId('call-status').props.children).toBe('DZWONIĘ · PRÓBA 2 Z 3');
  });
});
