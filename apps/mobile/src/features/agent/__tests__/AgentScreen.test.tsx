import { act, render, screen } from '@testing-library/react-native';

import { useCallTasksStore, useProfilesStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';

import AgentScreen from '../AgentScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const NEW = {
  mode: 'simulated',
  profileId: 'p1',
  examId: 'neurolog',
  facilityName: 'Przychodnia',
} as const;

function addTask(
  id: string,
  patch: Parameters<ReturnType<typeof useCallTasksStore.getState>['applyStatus']>[1],
) {
  act(() => {
    useCallTasksStore.getState().add({ id, ...NEW }, 1000);
    useCallTasksStore.getState().applyStatus(id, patch, 2000, patch.status === 'ended');
  });
}

describe('AgentScreen', () => {
  beforeEach(() => {
    act(() => {
      useCallTasksStore.getState().reset();
      useProfilesStore.setState({ profiles: [makeProfile({ id: 'p1' })], activeProfileId: 'p1' });
    });
  });

  it('no calls yet: empty ring, no "W toku" panel, no marketing blurb', () => {
    render(<AgentScreen />);
    expect(screen.getByTestId('agent-saved-total').props.children).toBe('0 min');
    expect(screen.getByText(/Zleć pierwszy telefon/)).toBeTruthy();
    expect(screen.queryByText('W toku')).toBeNull();
    expect(screen.queryByText(/Dzwonię do przychodni za Ciebie/)).toBeNull();
    expect(screen.getByTestId('agent-cta')).toBeTruthy();
  });

  it('shows the total saved time with a waiting / talking breakdown', () => {
    addTask('c1', {
      callId: 'c1',
      status: 'ended',
      transcript: [],
      result: { booked: true, date: '2026-10-20', time: null, note: null },
      stats: { attempts: 2, waitedSec: 25 * 60, talkedSec: 10 * 60 },
    });
    render(<AgentScreen />);
    expect(screen.getByTestId('agent-saved-total').props.children).toBe('35 min');
    expect(screen.getByText('25 min')).toBeTruthy();
    expect(screen.getByText('10 min')).toBeTruthy();
    expect(screen.getByText('Rozmowy: 2 · umówione wizyty: 1')).toBeTruthy();
    expect(screen.queryByTestId('agent-active')).toBeNull(); // finished → only in history
    expect(screen.getByText('Historia')).toBeTruthy();
  });

  it('"W toku" appears only while a call is on', () => {
    addTask('c2', {
      callId: 'c2',
      status: 'on_hold',
      transcript: [],
      result: null,
      stats: { attempts: 1, waitedSec: 9, talkedSec: 0 },
    });
    render(<AgentScreen />);
    expect(screen.getByTestId('agent-active')).toBeTruthy();
    expect(screen.getByText('W toku')).toBeTruthy();
  });
});
