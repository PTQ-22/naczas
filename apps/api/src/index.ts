import 'dotenv/config';

import path from 'node:path';

import { serve } from '@hono/node-server';

import { createApp } from './app';
import { createTwilioClient } from './call-assist/twilio-client';
import { createVapiClient } from './call-assist/vapi-client';
import { loadEnv } from './env';
import { createNfzClient } from './nfz/client';
import { GEO_INDEX_FILE, loadGeoIndex } from './nfz/geo-index';
import { createSnapshotStore } from './nfz/snapshot';
import { createQueueLoader } from './queues';

import type { CallAssistConfig } from './routes/call-assist';

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

const toAgent = env.CALL_TARGET === 'agent';
const assistantOptions = {
  voiceId: env.VAPI_VOICE_ID,
  publicUrl: env.PUBLIC_URL,
  webhookSecret: env.VAPI_WEBHOOK_SECRET,
  // Agent-to-agent: a short leash, so two polite bots can't loop on the meter.
  ...(toAgent && { maxDurationSeconds: 90 }),
};
/** The single number this server ever dials — chosen by the explicit CALL_TARGET flag. */
const callTo = toAgent ? env.DEMO_RECEPTIONIST_TO : env.DEMO_CALL_TO;
const vapi = env.VAPI_API_KEY ? createVapiClient({ apiKey: env.VAPI_API_KEY }) : null;
const callAssist: CallAssistConfig | null =
  vapi && callTo && env.VAPI_PHONE_NUMBER_ID
    ? {
        via: 'vapi-number',
        vapi,
        phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
        callTo,
        assistant: assistantOptions,
      }
    : vapi &&
        callTo &&
        env.TWILIO_ACCOUNT_SID &&
        env.TWILIO_AUTH_TOKEN &&
        env.TWILIO_FROM &&
        env.VAPI_SIP_URI
      ? {
          via: 'twilio-sip',
          vapi,
          twilio: createTwilioClient({
            accountSid: env.TWILIO_ACCOUNT_SID,
            authToken: env.TWILIO_AUTH_TOKEN,
          }),
          from: env.TWILIO_FROM,
          sipUri: env.VAPI_SIP_URI,
          callTo,
          assistant: assistantOptions,
        }
      : null;
console.log(
  `Call assist: ${
    callAssist
      ? `live (${callAssist.via} → ${toAgent ? 'receptionist agent' : 'team phone'}, ` +
        `${env.CALL_ASSIST_DAILY_LIMIT}/day)`
      : 'simulated'
  }`,
);

const nfz = createNfzClient({ baseUrl: env.NFZ_BASE_URL, apiVersion: env.NFZ_API_VERSION });
const snapshot = createSnapshotStore(path.resolve(import.meta.dirname, '../data/snapshot'));
const geoIndex = loadGeoIndex(GEO_INDEX_FILE);
console.log(`Geo index: ${Object.keys(geoIndex).length} places`);
const loader = createQueueLoader({ nfz, snapshot, now: () => new Date(), geoIndex });
const app = createApp({
  nfz,
  snapshot,
  loader,
  cors: { origins: env.CORS_ORIGINS, allowLocalhost: env.NODE_ENV !== 'production' },
  rateLimit: { perMinute: env.RATE_LIMIT_PER_MIN, trustProxy: env.TRUST_PROXY },
  log: (line) => console.log(line),
  callAssist,
  callAssistWebhookSecret: env.VAPI_WEBHOOK_SECRET,
  callAssistDailyLimit: env.CALL_ASSIST_DAILY_LIMIT,
  callTickMs: 15_000,
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
