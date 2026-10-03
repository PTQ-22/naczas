import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { rateLimit, type RateLimitOptions } from './middleware/rate-limit';
import { requestLog } from './middleware/request-log';
import { createQueueLoader, DataUnavailableError, type QueueLoader } from './queues';
import { authRoutes } from './routes/auth';
import {
  callAssistRoutes,
  callAssistWebhookRoutes,
  createCallStore,
  type CallAssistConfig,
} from './routes/call-assist';
import { errorResponse } from './routes/common';
import { coverageRoutes } from './routes/coverage';
import { facilitiesRoutes } from './routes/facilities';
import { healthRoutes } from './routes/health';
import { syncRoutes } from './routes/sync';
import { waitTimesRoutes } from './routes/wait-times';
import { loadCoverageData, type CoverageData } from './screening/data';
import { createUldkResolver, type CommuneResolver } from './screening/uldk';

import type { NfzClient } from './nfz/client';
import type { SnapshotStore } from './nfz/snapshot';

export interface CorsOptions {
  origins: readonly string[];
  /** Development: any http://localhost:* / 127.0.0.1:* (Expo web dev server port varies) */
  allowLocalhost: boolean;
}

export interface AppDeps {
  nfz: NfzClient;
  snapshot: SnapshotStore;
  now?: () => Date;
  /** Pass a prebuilt loader to warm it up / refresh it outside the app (index.ts). */
  loader?: QueueLoader;
  cors?: CorsOptions;
  rateLimit?: RateLimitOptions;
  log?: (line: string) => void;
  /** Screening coverage (data/screening) and coords → gmina resolver; real ones by default. */
  coverage?: CoverageData;
  communes?: CommuneResolver;
  /** "Zadzwoń za mnie": null/absent = scripted simulation instead of a real phone call */
  callAssist?: CallAssistConfig | null;
  callAssistWebhookSecret?: string | undefined;
}

const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function createApp({
  nfz,
  snapshot,
  now = () => new Date(),
  loader,
  cors: corsOptions = { origins: [], allowLocalhost: true },
  rateLimit: rateLimitOptions = { perMinute: 60, trustProxy: false },
  log,
  coverage = loadCoverageData(),
  communes = createUldkResolver(),
  callAssist = null,
  callAssistWebhookSecret,
}: AppDeps) {
  loader ??= createQueueLoader({ nfz, snapshot, now });

  const app = new Hono().basePath('/v1');
  if (log) app.use('*', requestLog(log));
  app.use(
    '*',
    cors({
      origin: (origin) =>
        corsOptions.origins.includes(origin) ||
        (corsOptions.allowLocalhost && LOCALHOST.test(origin))
          ? origin
          : null,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );
  app.route('/', healthRoutes(loader, snapshot)); // before the limiter: platform health checks
  const calls = createCallStore(() => now().getTime());
  app.route('/', callAssistWebhookRoutes({ store: calls, secret: callAssistWebhookSecret }));
  app.use(
    '*',
    rateLimit(rateLimitOptions, () => now().getTime()),
  );
  app.route('/', waitTimesRoutes(loader));
  app.route('/', facilitiesRoutes(loader));
  app.route('/', syncRoutes());
  app.route('/', coverageRoutes(coverage, communes));
  app.route('/', authRoutes());
  app.route(
    '/',
    callAssistRoutes({
      config: callAssist,
      store: calls,
      now,
      startLimit: { perMinute: 5, trustProxy: rateLimitOptions.trustProxy },
    }),
  );

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
