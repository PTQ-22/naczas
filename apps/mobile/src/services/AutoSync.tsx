import { useEffect } from 'react';

import { useProfilesStore, useRecordsStore, useStoresHydrated } from '@/store';
import { useSettingsStore } from '@/store/settings-store';

import { isApplyingPull, pushNow, syncFamily, useSyncStatus } from './cloud-sync';

/** Local edits are pushed after this much quiet, so a burst of taps is one request. */
const PUSH_DEBOUNCE_MS = 2000;

/**
 * Keeps the Konto Rodzinne in sync: one full sync per app start (after the local stores are
 * loaded — earlier, hydration could overwrite the pulled data), then a debounced push on every
 * change of profiles or records. Login runs its own full sync and marks it done.
 */
export function AutoSync() {
  const hydrated = useStoresHydrated();
  const familyCode = useSettingsStore((s) => s.familyCode);

  useEffect(() => {
    if (!hydrated || !familyCode) return;
    const status = useSyncStatus.getState();
    if (status.initialSyncFor !== familyCode && !status.syncing) {
      void syncFamily(familyCode).catch(() => undefined);
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      // Data written by a pull is the cloud's own copy — pushing it back is pointless.
      if (isApplyingPull()) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void pushNow(familyCode), PUSH_DEBOUNCE_MS);
    };
    const unsubProfiles = useProfilesStore.subscribe(schedule);
    const unsubRecords = useRecordsStore.subscribe(schedule);
    return () => {
      unsubProfiles();
      unsubRecords();
      if (timer) clearTimeout(timer);
    };
  }, [hydrated, familyCode]);

  return null;
}
