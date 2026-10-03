import { useCallback, useEffect, useState } from 'react';

import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermission,
} from '@/notifications';

/** null while the OS status is being read — render nothing until we know. */
export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    let alive = true;
    void getNotificationPermission().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  const request = useCallback(async () => {
    setStatus(await requestNotificationPermission());
  }, []);

  return { status, request };
}
