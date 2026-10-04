import { useEffect } from 'react';

import { buildDemoCalls } from '@/features/onboarding/demo-calls';
import { useCallTasksStore, useProfilesStore, useStoresHydrated, useToday } from '@/store';

/**
 * For now the Agent tab always has example calls: an empty history on a device that has a
 * profile gets the mock calls once (after the stores are loaded, so real data is never
 * overwritten). Remove this component when the app ships without mock data.
 */
export function DemoCallsSeed() {
  const hydrated = useStoresHydrated();
  const today = useToday();
  const profiles = useProfilesStore((s) => s.profiles);
  const activeId = useProfilesStore((s) => s.activeProfileId);

  useEffect(() => {
    if (!hydrated || profiles.length === 0 || useCallTasksStore.getState().demoSeeded) return;
    const main = profiles.find((p) => p.id === activeId) ?? profiles[0]!;
    const second = profiles.find((p) => p.id !== main.id) ?? main;
    useCallTasksStore
      .getState()
      .seedDemo(buildDemoCalls(today, { main: main.id, second: second.id }));
  }, [hydrated, profiles, activeId, today]);

  return null;
}
