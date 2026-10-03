import { useEffect } from 'react';

import type { Plan } from '@naczas/shared';

import { useProfilesStore, useRecordsStore } from '@/store';

import { syncNotifications } from './sync';

/**
 * Re-syncs OS notifications whenever the plans, records or profile names change (docs/05 §4:
 * recomputed on every app open and data change). Pass the plans of ALL profiles — a profile
 * missing here gets its reminders cancelled. `enabled: false` holds the sync (e.g. until every
 * plan is known); the app root uses <NotificationSync/> for this.
 */
export function useSyncNotifications(plans: readonly Plan[], enabled = true) {
  const records = useRecordsStore((s) => s.records);
  const profiles = useProfilesStore((s) => s.profiles);

  useEffect(() => {
    if (!enabled) return;
    // Real clock on purpose: the OS fires by device time (see buildNotificationRequests).
    syncNotifications({ plans, records, profiles, now: new Date() }).catch((err: unknown) => {
      // A failed reminder sync must never break the plan screen; surface it in dev only.
      // eslint-disable-next-line no-console -- dev-only diagnostics, no user data in the message
      if (__DEV__) console.warn('Notification sync failed', err);
    });
  }, [plans, records, profiles, enabled]);
}
