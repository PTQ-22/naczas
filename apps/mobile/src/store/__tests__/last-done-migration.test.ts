import AsyncStorage from '@react-native-async-storage/async-storage';

import { makeRecord } from '../__fixtures__/fixtures';
import { migrateDraftV2, migrateRecordsV1 } from '../last-done-migration';
import { emptyDraft, useOnboardingDraftStore } from '../onboarding-draft-store';
import { STORAGE_PREFIX } from '../persist';
import { useRecordsStore } from '../records-store';
import { useRestoreStatus } from '../restore-status';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  useRecordsStore.getState().reset();
  useOnboardingDraftStore.getState().clear();
  useRestoreStatus.getState().dismiss();
});

describe('migrateRecordsV1', () => {
  it('turns old buckets into the date they meant on the day they were saved', () => {
    const records = [
      { ...makeRecord(), lastDone: 'within_1y', updatedAt: '2026-10-04' },
      { ...makeRecord(), lastDone: '1_3y', updatedAt: '2026-10-04' },
      { ...makeRecord(), lastDone: 'over_3y' },
      makeRecord({ lastDone: '2025-02-01' }),
      makeRecord({ lastDone: 'never' }),
    ];
    const migrated = migrateRecordsV1({ records }) as { records: { lastDone: unknown }[] };
    expect(migrated.records.map((r) => r.lastDone)).toEqual([
      '2026-04-04',
      '2024-10-04',
      'over_interval',
      '2025-02-01',
      'never',
    ]);
  });

  it('leaves unexpected shapes alone', () => {
    expect(migrateRecordsV1(null)).toBeNull();
    expect(migrateRecordsV1({ records: [null] })).toEqual({ records: [null] });
  });

  it('keeps saved records on hydration instead of resetting the store', async () => {
    const old = { ...makeRecord(), lastDone: 'within_1y', updatedAt: '2026-10-04' };
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}records`,
      JSON.stringify({ state: { records: [old] }, version: 1 }),
    );
    await useRecordsStore.persist.rehydrate();

    expect(useRecordsStore.getState().records).toEqual([{ ...old, lastDone: '2026-04-04' }]);
    expect(useRestoreStatus.getState().failedStores).toEqual([]);
  });
});

describe('migrateDraftV2', () => {
  it('drops old answers so the last step is asked again', () => {
    const draft = {
      ...emptyDraft(),
      lastDone: { colonoscopy_screening: '1_3y', dental_checkup: 'never' },
    };
    expect(migrateDraftV2({ draft })).toEqual({
      draft: { ...draft, lastDone: { dental_checkup: 'never' } },
    });
    expect(migrateDraftV2({ draft: null })).toEqual({ draft: null });
  });

  it('a v1 draft goes through both migrations', async () => {
    const { quitOver15y: _q, otherLungRisk: _o, ...v1Draft } = emptyDraft();
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}onboarding-draft`,
      JSON.stringify({
        state: { draft: { ...v1Draft, lastDone: { dental_checkup: 'within_1y' } } },
        version: 1,
      }),
    );
    await useOnboardingDraftStore.persist.rehydrate();

    expect(useOnboardingDraftStore.getState().draft).toEqual(emptyDraft());
    expect(useRestoreStatus.getState().failedStores).toEqual([]);
  });
});
