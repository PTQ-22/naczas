import { Hono } from 'hono';

import type { HealthResponse } from '@naczas/shared';

import type { SnapshotStore } from '../nfz/snapshot';
import type { QueueLoader } from '../queues';

export function healthRoutes(loader: QueueLoader, snapshot: SnapshotStore) {
  // Does not call NFZ: a health probe must not eat into the NFZ rate limit.
  return new Hono().get('/health', async (c) => {
    const body: HealthResponse = {
      ok: true,
      nfz: loader.nfzStatus(),
      snapshotAsOf: (await snapshot.latestFetchedAt()) ?? 'none',
    };
    return c.json(body);
  });
}
