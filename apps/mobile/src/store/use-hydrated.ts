import { useSyncExternalStore } from 'react';

import { useDefaultFacilityStore } from './default-facility-store';
import { useOnboardingDraftStore } from './onboarding-draft-store';
import { useProfilesStore } from './profiles-store';
import { useRecordsStore } from './records-store';
import { useSettingsStore } from './settings-store';

const persistedStores = [
  useProfilesStore,
  useRecordsStore,
  useSettingsStore,
  useOnboardingDraftStore,
  useDefaultFacilityStore,
];

const allHydrated = () => persistedStores.every((store) => store.persist.hasHydrated());

function subscribe(onChange: () => void) {
  const unsubscribers = persistedStores.flatMap((store) => [
    store.persist.onHydrate(onChange),
    store.persist.onFinishHydration(onChange),
  ]);
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

/** True once every persisted store has finished loading from AsyncStorage. */
export function useStoresHydrated(): boolean {
  // Server snapshot is false: static web rendering has no AsyncStorage to read.
  return useSyncExternalStore(subscribe, allHydrated, () => false);
}
