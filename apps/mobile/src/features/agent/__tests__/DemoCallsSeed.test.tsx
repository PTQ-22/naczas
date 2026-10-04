import { act, render, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';

import { useCallTasksStore, useProfilesStore, useSettingsStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';

import { DemoCallsSeed } from '../DemoCallsSeed';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('DemoCallsSeed', () => {
  beforeEach(() => {
    act(() => {
      useSettingsStore.setState({ todayOverride: '2026-10-04' });
      useCallTasksStore.getState().reset();
      useProfilesStore.setState({
        profiles: [makeProfile({ id: 'me' }), makeProfile({ id: 'mum', name: 'Mama' })],
        activeProfileId: 'me',
      });
    });
  });

  it("fills an empty history with mock calls for the user's own profiles", async () => {
    render(
      <View>
        <DemoCallsSeed />
      </View>,
    );
    await waitFor(() => expect(useCallTasksStore.getState().tasks).toHaveLength(4));
    const owners = new Set(useCallTasksStore.getState().tasks.map((t) => t.profileId));
    expect([...owners].sort()).toEqual(['me', 'mum']);
  });

  it('only once: calls the user removed do not come back', async () => {
    render(
      <View>
        <DemoCallsSeed />
      </View>,
    );
    await waitFor(() => expect(useCallTasksStore.getState().demoSeeded).toBe(true));
    await act(async () => {
      useCallTasksStore.setState({ tasks: [] });
      await Promise.resolve();
    });
    render(
      <View>
        <DemoCallsSeed />
      </View>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(useCallTasksStore.getState().tasks).toEqual([]);
  });

  it('never touches a history that already has calls', async () => {
    act(() => {
      useCallTasksStore
        .getState()
        .add(
          { id: 'real', mode: 'live', profileId: 'me', examId: 'neurolog', facilityName: 'X' },
          1,
        );
    });
    render(
      <View>
        <DemoCallsSeed />
      </View>,
    );
    await waitFor(() => expect(useCallTasksStore.getState().demoSeeded).toBe(true));
    expect(useCallTasksStore.getState().tasks.map((t) => t.id)).toEqual(['real']);
  });
});
