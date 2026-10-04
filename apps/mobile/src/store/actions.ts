import { useAvailabilityStore } from './availability-store';
import { useCallTasksStore } from './call-tasks-store';
import { useDefaultFacilityStore } from './default-facility-store';
import { useOnboardingDraftStore } from './onboarding-draft-store';
import { useProfilesStore } from './profiles-store';
import { useRecordsStore } from './records-store';
import { useSettingsStore } from './settings-store';

/** Cross-store: a removed person must not leave health data behind on the device. */
export function deleteProfileWithData(profileId: string) {
  useRecordsStore.getState().removeRecordsForProfile(profileId);
  useAvailabilityStore.getState().removeProfile(profileId);
  useCallTasksStore.getState().removeProfile(profileId);
  useProfilesStore.getState().removeProfile(profileId);
}

/** Settings → "Delete all data". */
export function resetAllData() {
  useRecordsStore.getState().reset();
  useAvailabilityStore.getState().reset();
  useCallTasksStore.getState().reset();
  useProfilesStore.getState().reset();
  useSettingsStore.getState().reset();
  useDefaultFacilityStore.getState().clear();
  useOnboardingDraftStore.getState().clear();
}
