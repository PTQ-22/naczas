import AsyncStorage from '@react-native-async-storage/async-storage';

import { makeProfile, makeRecord } from '../__fixtures__/fixtures';
import { deleteProfileWithData, resetAllData } from '../actions';
import { selectActiveProfile, useProfilesStore } from '../profiles-store';
import { useRecordsStore } from '../records-store';
import { useSettingsStore } from '../settings-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mama = makeProfile();
const kasia = makeProfile({ id: 'p-kasia', name: 'Kasia', relation: 'self', birthYear: 1994 });

const store = () => useProfilesStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  resetAllData();
});

describe('profiles store', () => {
  it('makes the first added profile active', () => {
    store().addProfile(mama);
    store().addProfile(kasia);

    expect(store().profiles).toHaveLength(2);
    expect(store().activeProfileId).toBe(mama.id);
    expect(selectActiveProfile(store())).toEqual(mama);
  });

  it('replaces a profile added twice with the same id', () => {
    store().addProfile(mama);
    store().addProfile({ ...mama, name: 'Mamusia' });

    expect(store().profiles).toEqual([{ ...mama, name: 'Mamusia' }]);
  });

  it('updates fields of one profile', () => {
    store().addProfile(mama);
    store().addProfile(kasia);
    store().updateProfile(mama.id, { conditions: ['diabetes'] });

    expect(store().profiles.find((p) => p.id === mama.id)?.conditions).toEqual(['diabetes']);
    expect(store().profiles.find((p) => p.id === kasia.id)).toEqual(kasia);
  });

  it('moves active to the next profile when the active one is removed', () => {
    store().addProfile(mama);
    store().addProfile(kasia);
    store().removeProfile(mama.id);

    expect(store().activeProfileId).toBe(kasia.id);
    store().removeProfile(kasia.id);
    expect(store().activeProfileId).toBeNull();
  });

  it('ignores switching to an unknown profile', () => {
    store().addProfile(mama);
    store().setActiveProfile('nope');

    expect(store().activeProfileId).toBe(mama.id);
  });

  it('persists to AsyncStorage', async () => {
    store().addProfile(mama);
    const raw = await AsyncStorage.getItem('naczas:profiles');

    expect(JSON.parse(raw ?? '{}')).toEqual({
      state: { profiles: [mama], activeProfileId: mama.id },
      version: 1,
    });
  });
});

describe('cross-store actions', () => {
  it('deleteProfileWithData removes the profile and only its records', () => {
    store().addProfile(mama);
    store().addProfile(kasia);
    useRecordsStore.getState().upsertRecord(makeRecord());
    useRecordsStore.getState().upsertRecord(makeRecord({ profileId: kasia.id }));

    deleteProfileWithData(mama.id);

    expect(store().profiles).toEqual([kasia]);
    expect(useRecordsStore.getState().records.map((r) => r.profileId)).toEqual([kasia.id]);
  });

  it('resetAllData clears profiles, records and settings', () => {
    store().addProfile(mama);
    useRecordsStore.getState().upsertRecord(makeRecord());
    useSettingsStore.getState().setSeniorMode(true);

    resetAllData();

    expect(store().profiles).toEqual([]);
    expect(useRecordsStore.getState().records).toEqual([]);
    expect(useSettingsStore.getState().seniorMode).toBe(false);
  });
});
