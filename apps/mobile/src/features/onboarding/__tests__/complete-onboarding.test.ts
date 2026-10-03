import AsyncStorage from '@react-native-async-storage/async-storage';

import { ExamRecordSchema, ProfileSchema } from '@naczas/shared';

import { resetAllData, useOnboardingDraftStore, useProfilesStore, useRecordsStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';
import { STORAGE_PREFIX } from '@/store/persist';

import { completeOnboarding, createProfileId } from '../complete-onboarding';
import { examsToAsk } from '../survey';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const TODAY = '2026-10-04';
const draft = () => useOnboardingDraftStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  resetAllData();
});

/** Walks the 7 steps the way the screens do: one store update per answer. */
function answerWholeSurvey() {
  draft().start({ forRelative: true });
  draft().update({ name: 'Halina', relation: 'parent' }); // 1
  draft().update({ birthYear: 1968, sex: 'female' }); // 2
  draft().update({
    postalCode: '00-950',
    location: { province: '07', lat: 52.23, lng: 21.01, label: 'mazowieckie' },
  }); // 3
  draft().update({ conditions: ['diabetes'] }); // 4
  draft().update({ familyHistory: ['colorectal_cancer'] }); // 5
  draft().update({ smoking: 'never', activity: 'low' }); // 6
  const asked = examsToAsk(draft().draft!, TODAY);
  asked.forEach((rule) => draft().setLastDone(rule.id, 'unknown')); // 7
  draft().setLastDone('colonoscopy_screening', 'over_interval');
  return asked;
}

describe('completeOnboarding — full survey', () => {
  it('creates a valid Profile and ExamRecord[] and makes the profile active', () => {
    const asked = answerWholeSurvey();

    const profile = completeOnboarding(draft().draft!, { today: TODAY, selfName: 'Ja', id: 'p1' });

    expect(profile && ProfileSchema.parse(profile)).toEqual({
      id: 'p1',
      name: 'Halina',
      relation: 'parent',
      birthYear: 1968,
      sex: 'female',
      location: { province: '07', lat: 52.23, lng: 21.01, label: 'mazowieckie' },
      conditions: ['diabetes'],
      familyHistory: ['colorectal_cancer'],
      smoking: { status: 'never' },
      activity: 'low',
      createdAt: TODAY,
    });

    const records = useRecordsStore.getState().records;
    expect(records).toHaveLength(asked.length);
    records.forEach((r) => ExamRecordSchema.parse(r));
    expect(records.find((r) => r.examId === 'colonoscopy_screening')).toEqual({
      profileId: 'p1',
      examId: 'colonoscopy_screening',
      lastDone: 'over_interval',
      status: 'none',
      updatedAt: TODAY,
    });

    expect(useProfilesStore.getState().activeProfileId).toBe('p1');
    expect(draft().draft).toBeNull();
  });

  it('switches to a newly added relative even when another profile exists', () => {
    useProfilesStore.getState().addProfile(makeProfile({ id: 'me', relation: 'self' }));
    answerWholeSurvey();

    completeOnboarding(draft().draft!, { today: TODAY, selfName: 'Ja', id: 'p2' });

    expect(useProfilesStore.getState().activeProfileId).toBe('p2');
  });

  it('refuses to save an incomplete survey', () => {
    draft().start();
    expect(completeOnboarding(draft().draft!, { today: TODAY, selfName: 'Ja' })).toBeNull();
    expect(useProfilesStore.getState().profiles).toEqual([]);
  });
});

describe('draft persistence', () => {
  it('saves every answer so an interrupted survey can resume', async () => {
    draft().start();
    draft().update({ who: 'self', birthYear: 1990 });

    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}onboarding-draft`);
    expect(JSON.parse(raw ?? 'null')).toMatchObject({
      state: { draft: { who: 'self', birthYear: 1990 } },
    });
  });
});

describe('createProfileId', () => {
  it('is deterministic for the same clock and random input', () => {
    expect(createProfileId(1_700_000_000_000, 0.5)).toBe(createProfileId(1_700_000_000_000, 0.5));
    expect(createProfileId(1, 0.1)).not.toBe(createProfileId(1, 0.2));
  });
});
