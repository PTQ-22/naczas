import { useCallback, useEffect, useState } from 'react';

import type { Profile, ExamRecord } from '@naczas/shared';

import { useProfilesStore, useRecordsStore, useSettingsStore } from '@/store';

const envApiUrl: unknown = process.env.EXPO_PUBLIC_API_URL;
const API_BASE_URL =
  typeof envApiUrl === 'string' && envApiUrl ? envApiUrl : 'http://localhost:8787';

export function useCloudSync() {
  const familyCode = useSettingsStore((s) => s.familyCode);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const push = useCallback(async () => {
    if (!familyCode) return;
    setSyncing(true);
    setError(null);
    try {
      const profiles = useProfilesStore.getState().profiles;
      const records = useRecordsStore.getState().records;

      const response = await fetch(`${API_BASE_URL}/v1/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode,
          profiles,
          records,
        }),
      });

      if (!response.ok) {
        throw new Error('Sync push failed');
      }
      setLastSync(new Date());
    } catch (e) {
      // ignore
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  }, [familyCode]);

  const pull = useCallback(async () => {
    if (!familyCode) return;
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/sync/pull/${familyCode}`);
      if (!response.ok) {
        throw new Error('Sync pull failed');
      }
      const data = (await response.json()) as {
        profiles?: Profile[];
        records?: ExamRecord[];
      };

      if (data.profiles && data.profiles.length > 0) {
        const syncedProfiles = data.profiles;
        useProfilesStore.setState((state) => {
          const stillExists = syncedProfiles.some((p) => p.id === state.activeProfileId);
          return {
            profiles: syncedProfiles,
            activeProfileId: stillExists ? state.activeProfileId : (syncedProfiles[0]?.id ?? null),
          };
        });
        if (data.records) useRecordsStore.setState({ records: data.records });
      }
      setLastSync(new Date());
      setLastSync(new Date());
    } catch (e) {
      // ignore
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  }, [familyCode]);

  // Initial sync when familyCode changes
  useEffect(() => {
    if (familyCode) {
      void (async () => {
        // If we have local data, push it to the cloud first so it's not lost
        if (useProfilesStore.getState().profiles.length > 0) {
          await push();
        }
        await pull();
      })();
    }
  }, [familyCode, push, pull]);

  return { push, pull, syncing, lastSync, error };
}
