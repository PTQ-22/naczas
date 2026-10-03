import AsyncStorage from '@react-native-async-storage/async-storage';

import { makeProfile } from '../__fixtures__/fixtures';
import { emptyDraft, useOnboardingDraftStore } from '../onboarding-draft-store';
import { STORAGE_PREFIX } from '../persist';
import { useProfilesStore } from '../profiles-store';
import { useRestoreStatus } from '../restore-status';
import { dropRetiredAnswers, migrateDraftV1, migrateProfilesV1 } from '../survey-v2-migration';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/** A profile saved by survey v1, with answers v2 no longer asks. */
const v1Profile = {
  ...makeProfile(),
  conditions: ['diabetes', 'hypertension', 'other'],
  familyHistory: ['colorectal_cancer', 'prostate_cancer', 'early_cardiovascular'],
  heightCm: 165,
  weightKg: 70,
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useProfilesStore.getState().reset();
  useOnboardingDraftStore.getState().clear();
  useRestoreStatus.getState().dismiss();
});

describe('dropRetiredAnswers', () => {
  it('keeps only answers that still exist', () => {
    expect(dropRetiredAnswers(v1Profile)).toEqual(
      makeProfile({ conditions: ['diabetes'], familyHistory: ['colorectal_cancer'] }),
    );
  });

  it('leaves non-objects alone', () => {
    expect(dropRetiredAnswers(null)).toBeNull();
    expect(migrateProfilesV1('x')).toBe('x');
    expect(migrateDraftV1({ draft: null })).toEqual({ draft: null });
  });
});

describe('hydrating v1 data', () => {
  it('keeps saved profiles instead of resetting the store', async () => {
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}profiles`,
      JSON.stringify({ state: { profiles: [v1Profile], activeProfileId: 'p-mama' }, version: 1 }),
    );
    await useProfilesStore.persist.rehydrate();

    expect(useProfilesStore.getState().profiles).toEqual([
      makeProfile({ conditions: ['diabetes'], familyHistory: ['colorectal_cancer'] }),
    ]);
    expect(useRestoreStatus.getState().failedStores).toEqual([]);
  });

  it('keeps an unfinished survey and adds the new smoking answers as unanswered', async () => {
    const { quitOver15y: _q, otherLungRisk: _o, ...v1Draft } = emptyDraft();
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}onboarding-draft`,
      JSON.stringify({
        state: { draft: { ...v1Draft, conditions: ['hypertension'], heightCm: 180 } },
        version: 1,
      }),
    );
    await useOnboardingDraftStore.persist.rehydrate();

    expect(useOnboardingDraftStore.getState().draft).toEqual(emptyDraft());
    expect(useRestoreStatus.getState().failedStores).toEqual([]);
  });
});
