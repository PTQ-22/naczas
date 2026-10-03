import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import type { Plan } from '@naczas/shared';

import { usePlan } from '@/services';
import { useProfilesStore, useStoresHydrated } from '@/store';

import { useSyncNotifications } from './use-sync-notifications';

type OnPlan = (profileId: string, plan: Plan) => void;

/** One hook per profile (hooks can't run in a loop) — reports the plan once it has settled. */
function ProfilePlan({ profileId, onPlan }: { profileId: string; onPlan: OnPlan }) {
  const { plan, status } = usePlan(profileId);
  useEffect(() => {
    // Wait for NFZ wait times ('ready' or 'offline'): syncing the default-lead-time plan first
    // would schedule and then immediately reschedule every reminder.
    if (status !== 'loading') onPlan(profileId, plan);
  }, [profileId, plan, status, onPlan]);
  return null;
}

/**
 * Keeps OS reminders in sync with the plans of every person on the device. Mounted once at the
 * app root, so reminders follow data changes no matter which screen is open (docs/05 §4).
 * Renders nothing; on web there are no native notifications, so it skips the work entirely.
 */
export function NotificationSync() {
  if (Platform.OS === 'web') return null;
  return <NativeNotificationSync />;
}

function NativeNotificationSync() {
  const hydrated = useStoresHydrated();
  const profileIds = useProfilesStore(useShallow((s) => s.profiles.map((p) => p.id)));
  const [settled, setSettled] = useState<Record<string, Plan>>({});

  const onPlan = useCallback<OnPlan>(
    (profileId, plan) =>
      setSettled((prev) => (prev[profileId] === plan ? prev : { ...prev, [profileId]: plan })),
    [],
  );

  const plans = useMemo(
    () => profileIds.map((id) => settled[id]).filter((p): p is Plan => p !== undefined),
    [profileIds, settled],
  );
  // Before hydration the store looks empty, and a partial plan list would cancel the other
  // people's reminders — sync only once every profile has reported.
  const ready = hydrated && profileIds.every((id) => id in settled);
  useSyncNotifications(plans, ready);

  return (
    <>
      {profileIds.map((id) => (
        <ProfilePlan key={id} profileId={id} onPlan={onPlan} />
      ))}
    </>
  );
}
