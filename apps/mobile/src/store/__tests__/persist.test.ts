import AsyncStorage from '@react-native-async-storage/async-storage';

import { makeProfile } from '../__fixtures__/fixtures';
import { runMigrations, STORAGE_PREFIX } from '../persist';
import { useProfilesStore } from '../profiles-store';
import { useRestoreStatus } from '../restore-status';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const KEY = `${STORAGE_PREFIX}profiles`;

async function storeRaw(value: string) {
  await AsyncStorage.setItem(KEY, value);
  await useProfilesStore.persist.rehydrate();
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useProfilesStore.getState().reset();
  useRestoreStatus.getState().dismiss();
});

describe('runMigrations', () => {
  const migrations = {
    1: (s: unknown) => ({ ...(s as object), b: 2 }),
    2: (s: unknown) => ({ ...(s as object), c: 3 }),
  };

  it('applies steps in order from the stored version', () => {
    expect(runMigrations({ a: 1 }, 1, 3, migrations)).toEqual({ a: 1, b: 2, c: 3 });
    expect(runMigrations({ a: 1 }, 2, 3, migrations)).toEqual({ a: 1, c: 3 });
  });

  it('rejects data from a newer app version', () => {
    expect(() => runMigrations({}, 4, 3, migrations)).toThrow();
  });

  it('rejects a gap in the migration chain', () => {
    expect(() => runMigrations({}, 0, 3, migrations)).toThrow();
  });
});

describe('rehydration', () => {
  it('restores valid persisted state', async () => {
    const profile = makeProfile();
    await storeRaw(
      JSON.stringify({ state: { profiles: [profile], activeProfileId: profile.id }, version: 1 }),
    );

    expect(useProfilesStore.getState().profiles).toEqual([profile]);
    expect(useProfilesStore.getState().activeProfileId).toBe(profile.id);
    expect(useRestoreStatus.getState().failedStores).toEqual([]);
  });

  it('resets to defaults and reports when data fails validation', async () => {
    await storeRaw(
      JSON.stringify({
        state: { profiles: [{ id: 'x', birthYear: 'nineteen' }], activeProfileId: 'x' },
        version: 1,
      }),
    );

    expect(useProfilesStore.getState().profiles).toEqual([]);
    expect(useRestoreStatus.getState().failedStores).toEqual([KEY]);
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('does not hang hydration on unparseable JSON', async () => {
    await storeRaw('{not json');

    expect(useProfilesStore.persist.hasHydrated()).toBe(true);
    expect(useProfilesStore.getState().profiles).toEqual([]);
    expect(useRestoreStatus.getState().failedStores).toEqual([KEY]);
  });

  it('resets when the stored version cannot be migrated', async () => {
    await storeRaw(JSON.stringify({ state: { profiles: [], activeProfileId: null }, version: 9 }));

    expect(useProfilesStore.persist.hasHydrated()).toBe(true);
    expect(useRestoreStatus.getState().failedStores).toEqual([KEY]);
  });

  it('treats empty storage as a fresh install, not an error', async () => {
    await useProfilesStore.persist.rehydrate();

    expect(useProfilesStore.persist.hasHydrated()).toBe(true);
    expect(useRestoreStatus.getState().failedStores).toEqual([]);
  });
});
