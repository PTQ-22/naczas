import { Hono } from 'hono';

import { createQueueLoader, DataUnavailableError, type QueueLoader } from './queues';
import { errorResponse } from './routes/common';
import { facilitiesRoutes } from './routes/facilities';
import { healthRoutes } from './routes/health';
import { waitTimesRoutes } from './routes/wait-times';

import type { NfzClient } from './nfz/client';
import type { SnapshotStore } from './nfz/snapshot';

export interface AppDeps {
  nfz: NfzClient;
  snapshot: SnapshotStore;
  now?: () => Date;
  /** Pass a prebuilt loader to warm it up / refresh it outside the app (index.ts). */
  loader?: QueueLoader;
}

export function createApp({ nfz, snapshot, now = () => new Date(), loader }: AppDeps) {
  loader ??= createQueueLoader({ nfz, snapshot, now });

  const app = new Hono().basePath('/v1');
  app.route('/', healthRoutes(loader, snapshot));
  app.route('/', waitTimesRoutes(loader));
  app.route('/', facilitiesRoutes(loader));

  app.notFound((c) => errorResponse(c, 404, 'not_found', 'Unknown endpoint'));
  app.onError((err, c) => {
    if (err instanceof DataUnavailableError) {
      return errorResponse(c, 503, 'data_unavailable', 'NFZ is unavailable and no snapshot exists');
    }
    console.error(err); // query strings (coordinates) are deliberately not logged
    return errorResponse(c, 500, 'internal', 'Internal server error');
  });

  return app;
}
