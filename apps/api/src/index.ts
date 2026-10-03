import 'dotenv/config';

import path from 'node:path';

import { serve } from '@hono/node-server';

import { createApp } from './app';
import { createVapiClient } from './call-assist/vapi-client';
import { loadEnv } from './env';
import { createNfzClient } from './nfz/client';
import { createSnapshotStore } from './nfz/snapshot';
import { createQueueLoader } from './queues';

// Most populous provinces first: their cache gets live NFZ data soonest after a restart.
const REFRESH_ORDER = [
  '07',
  '12',
  '15',
  '06',
  '01',
  '05',
  '11',
  '03',
  '09',
  '02',
  '16',
  '14',
  '13',
  '10',
  '04',
  '08',
];

const env = loadEnv();

const callAssist =
  env.VAPI_API_KEY && env.VAPI_PHONE_NUMBER_ID && env.DEMO_CALL_TO
    ? {
        vapi: createVapiClient({ apiKey: env.VAPI_API_KEY }),
        phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
        callTo: env.DEMO_CALL_TO,
        assistant: {
          voiceId: env.VAPI_VOICE_ID,
          publicUrl: env.PUBLIC_URL,
          webhookSecret: env.VAPI_WEBHOOK_SECRET,
        },
      }
    : null;
console.log(`Call assist: ${callAssist ? 'live (Vapi)' : 'simulated'}`);

const nfz = createNfzClient();
const snapshot = createSnapshotStore(path.resolve(import.meta.dirname, '../data/snapshot'));
const loader = createQueueLoader({ nfz, snapshot, now: () => new Date() });
const app = createApp({
  nfz,
  snapshot,
  loader,
  cors: { origins: env.CORS_ORIGINS, allowLocalhost: env.NODE_ENV !== 'production' },
  rateLimit: { perMinute: env.RATE_LIMIT_PER_MIN, trustProxy: env.TRUST_PROXY },
  log: (line) => console.log(line),
  callAssist,
  callAssistWebhookSecret: env.VAPI_WEBHOOK_SECRET,
});

// Warm-up before listening: the first request is answered from the snapshot immediately.
const warmed = await loader.warmUpFromSnapshot();
console.log(`Cache warmed with ${warmed} snapshot entries`);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

if (env.REFRESH_ON_START) {
  const entries = await snapshot.readAll();
  const keys = entries
    .map(({ province, benefit }) => ({ province, benefit }))
    .sort((a, b) => REFRESH_ORDER.indexOf(a.province) - REFRESH_ORDER.indexOf(b.province));
  void loader.refreshFromNfz(keys).then(() => console.log('Background NFZ refresh done'));
}
