import path from 'node:path';

import { serve } from '@hono/node-server';

import { createApp } from './app';
import { createNfzClient } from './nfz/client';
import { createSnapshotStore } from './nfz/snapshot';

const port = Number(process.env.PORT ?? 8787);
const app = createApp({
  nfz: createNfzClient(),
  snapshot: createSnapshotStore(path.resolve(import.meta.dirname, '../data/snapshot')),
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
