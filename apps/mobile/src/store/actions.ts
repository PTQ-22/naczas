import { useProfilesStore } from './profiles-store';
import { useRecordsStore } from './records-store';
import { useSettingsStore } from './settings-store';

/** Cross-store: a removed person must not leave health data behind on the device. */
export function deleteProfileWithData(profileId: string) {
  useRecordsStore.getState().removeRecordsForProfile(profileId);
  useProfilesStore.getState().removeProfile(profileId);
}

/** Settings → "Delete all data". */
export function resetAllData() {
  useRecordsStore.getState().reset();
  useProfilesStore.getState().reset();
  useSettingsStore.getState().reset();
}
