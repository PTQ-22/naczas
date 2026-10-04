import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { CallAssistStatus } from '@naczas/shared';

import { useCallTasksStore, useProfilesStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';

import CallDetailScreen from '../CallDetailScreen';

let mockTaskId = 'c1';
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ taskId: mockTaskId }),
  router: { back: (...a: unknown[]) => mockBack(...a) as unknown, push: jest.fn() },
}));
jest.mock('react-native-worklets', () =>
  jest.requireActual<object>('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  jest.requireActual<object>('react-native-reanimated/mock'),
);
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockCancel = jest.fn();
jest.mock('@/features/call-assist/call-tasks', () => ({
  cancelTask: (...a: unknown[]) => mockCancel(...a) as unknown,
  retryTaskNow: jest.fn(),
}));

function addTask(
  id: string,
  status: Partial<CallAssistStatus> & { status: CallAssistStatus['status'] },
  closed: boolean,
) {
  act(() => {
    useCallTasksStore.getState().add(
      {
        id,
        mode: 'simulated',
        profileId: 'p1',
        examId: 'neurolog',
        facilityName: 'Przychodnia Zdrowie',
      },
      1_000_000,
    );
    useCallTasksStore
      .getState()
      .applyStatus(id, { callId: id, transcript: [], result: null, ...status }, 2_000_000, closed);
  });
}

describe('CallDetailScreen', () => {
  beforeEach(() => {
    mockTaskId = 'c1';
    mockBack.mockReset();
    mockCancel.mockReset().mockResolvedValue(undefined);
    act(() => {
      useCallTasksStore.getState().reset();
      useProfilesStore.setState({ profiles: [makeProfile({ id: 'p1' })], activeProfileId: 'p1' });
    });
  });

  it('a booked call: the outcome, the phone time and the whole conversation', () => {
    addTask(
      'c1',
      {
        status: 'ended',
        result: { booked: true, date: '2026-10-20', time: '17:00', note: null },
        stats: { attempts: 2, waitedSec: 14, talkedSec: 29 },
        transcript: [
          { role: 'clinic', text: 'Rejestracja, słucham.' },
          { role: 'agent', text: 'Dzień dobry, jestem asystentem AI.' },
        ],
      },
      true,
    );
    render(<CallDetailScreen />);
    expect(screen.getByText('Neurolog')).toBeTruthy();
    expect(screen.getByText('Przychodnia Zdrowie')).toBeTruthy();
    expect(screen.getByText('20.10')).toBeTruthy();
    expect(screen.getByText('Rejestracja, słucham.')).toBeTruthy();
    expect(screen.getByText('Dzień dobry, jestem asystentem AI.')).toBeTruthy();
    expect(screen.getByTestId('call-stats').props.children).toBe(
      'Próby: 2 · na linii 0:14 · rozmowa 0:29',
    );
  });

  it('a call nobody answered: says there is no recording, offers removing it from history', () => {
    addTask('c1', { status: 'failed', stats: { attempts: 3, waitedSec: 18, talkedSec: 0 } }, true);
    render(<CallDetailScreen />);
    expect(screen.getByTestId('detail-no-transcript').props.children).toMatch(/Brak zapisu/);
    fireEvent.press(screen.getByTestId('detail-remove'));
    expect(mockBack).toHaveBeenCalled();
    expect(useCallTasksStore.getState().tasks).toEqual([]);
  });

  it('a call in progress can be cancelled from here', () => {
    addTask('c1', { status: 'on_hold', stats: { attempts: 1, waitedSec: 5, talkedSec: 0 } }, false);
    render(<CallDetailScreen />);
    expect(screen.getByTestId('detail-status').props.children).toBe('CZEKAM NA LINII · 0:05');
    fireEvent.press(screen.getByTestId('detail-cancel'));
    expect(mockCancel).toHaveBeenCalledWith('c1');
  });

  it('an unknown task id shows a message instead of crashing', () => {
    mockTaskId = 'nope';
    render(<CallDetailScreen />);
    expect(screen.getByText('Nie znaleziono tej rozmowy')).toBeTruthy();
  });
});
