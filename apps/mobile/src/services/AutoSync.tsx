import { useEffect, useRef } from 'react';

import { useProfilesStore, useRecordsStore, useBetStore } from '@/store';
import { useSettingsStore } from '@/store/settings-store';

import { useCloudSync } from './cloud-sync';

export function AutoSync() {
  const { push } = useCloudSync();
  const familyCode = useSettingsStore((s) => s.familyCode);

  // Keep track of the timeout for debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track previous states to avoid initial push
  const initialRender = useRef(true);

  useEffect(() => {
    // If user is not logged in, don't do anything
    if (!familyCode) return;

    const handleChange = () => {
      // Avoid pushing during the very first hydration/render
      if (initialRender.current) return;

      // Debounce the push to avoid spamming the server on rapid state changes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        void push();
      }, 2000); // Wait 2 seconds of inactivity before pushing
    };

    // Subscribe to all relevant stores
    const unsubProfiles = useProfilesStore.subscribe(handleChange);
    const unsubRecords = useRecordsStore.subscribe(handleChange);
    const unsubBets = useBetStore.subscribe(handleChange);

    // Mark initial render as done after a tiny delay so pull() has time to finish
    setTimeout(() => {
      initialRender.current = false;
    }, 1000);

    return () => {
      unsubProfiles();
      unsubRecords();
      unsubBets();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [familyCode, push]);

  return null;
}
