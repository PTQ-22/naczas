import AsyncStorage from '@react-native-async-storage/async-storage';

import { useOnboardingDraftStore } from '../onboarding-draft-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const store = () => useOnboardingDraftStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  store().clear();
});

describe('onboarding draft — last done answers', () => {
  it('clearLastDone removes only that exam, leaving it unanswered ("nie pamiętam")', () => {
    store().setLastDone('dental_checkup', 'within_half_interval');
    store().setLastDone('eye_exam', 'never');
    store().clearLastDone('dental_checkup');
    expect(store().draft?.lastDone).toEqual({ eye_exam: 'never' });
  });
});
