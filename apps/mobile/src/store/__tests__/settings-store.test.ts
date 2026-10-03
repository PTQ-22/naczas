import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { STORAGE_PREFIX } from '../persist';
import { useRestoreStatus } from '../restore-status';
import { useSettingsStore } from '../settings-store';
import { resolveToday, useToday } from '../use-today';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const store = () => useSettingsStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  store().reset();
  useRestoreStatus.getState().dismiss();
});

describe('settings store', () => {
  it('has accessible, system-following defaults', () => {
    expect(store()).toMatchObject({ seniorMode: false, darkMode: 'system', todayOverride: null });
  });

  it('updates preferences', () => {
    store().setSeniorMode(true);
    store().setDarkMode('dark');
    store().setTodayOverride('2026-10-04');

    expect(store()).toMatchObject({
      seniorMode: true,
      darkMode: 'dark',
      todayOverride: '2026-10-04',
    });
  });

  it('rejects a malformed todayOverride from storage', async () => {
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}settings`,
      JSON.stringify({
        state: { seniorMode: true, darkMode: 'dark', todayOverride: '04.10.2026' },
        version: 1,
      }),
    );
    await useSettingsStore.persist.rehydrate();

    expect(store().todayOverride).toBeNull();
    expect(store().seniorMode).toBe(false);
    expect(useRestoreStatus.getState().failedStores).toHaveLength(1);
  });
});

describe('resolveToday', () => {
  const now = new Date(2026, 9, 3, 23, 30); // local time, month is 0-based

  it('formats the local calendar date when there is no override', () => {
    expect(resolveToday(null, now)).toBe('2026-10-03');
  });

  it('prefers the demo override', () => {
    expect(resolveToday('2027-01-11', now)).toBe('2027-01-11');
  });
});

describe('useToday', () => {
  it('follows todayOverride changes', () => {
    const { result } = renderHook(() => useToday());
    expect(result.current).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    act(() => {
      store().setTodayOverride('2026-10-04');
    });
    expect(result.current).toBe('2026-10-04');
  });
});
