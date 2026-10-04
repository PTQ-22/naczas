/**
 * Builds data/geo/places.json: place address → coordinates from ITL v1.3, which (unlike v1.4)
 * still returns latitude/longitude. See src/nfz/geo-index.ts.
 * Run in the background: pnpm --filter @naczas/api geo-index (~15 min, NFZ rate limit).
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ProvinceCodeSchema } from '@naczas/shared';

import { allNfzBenefits } from '../src/exam-benefits';
import { createNfzClient, NfzUnavailableError } from '../src/nfz/client';
import { type GeoIndex, placeKey } from '../src/nfz/geo-index';

const FILE = path.resolve(import.meta.dirname, '../data/geo/places.json');

const v13 = createNfzClient({
  baseUrl: 'https://api.nfz.gov.pl/app-itl-api',
  apiVersion: '1.3',
  minIntervalMs: 1100,
  timeoutMs: 15_000,
});

const index: GeoIndex = {};
const failed: string[] = [];
for (const province of ProvinceCodeSchema.options) {
  for (const benefit of allNfzBenefits) {
    try {
      const queues = await v13.getQueues({ benefit, province });
      let added = 0;
      for (const q of queues) {
        const key = placeKey(q);
        const { latitude, longitude } = q.attributes;
        if (!key || latitude == null || longitude == null || index[key]) continue;
        index[key] = [latitude, longitude];
        added++;
      }
      console.log(`${province} ${benefit}: ${queues.length} records, +${added} places`);
    } catch (err) {
      if (!(err instanceof NfzUnavailableError)) throw err;
      failed.push(`${province} ${benefit}`);
      console.warn(`FAILED ${province} ${benefit}: ${err.message}`);
    }
  }
}

// One entry per line, sorted: small diffs on re-runs.
const sorted = Object.keys(index).sort();
const body = sorted.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(index[k])}`).join(',\n');
await writeFile(FILE, `{\n${body}\n}\n`);
console.log(`${sorted.length} places → ${path.relative(process.cwd(), FILE)}`);
if (failed.length > 0) {
  console.error(`Missing ${failed.length} entries:\n${failed.join('\n')}`);
  process.exitCode = 1;
}
