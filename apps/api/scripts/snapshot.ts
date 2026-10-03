/**
 * Records the offline fallback: every NFZ benefit we use × 16 provinces → data/snapshot.
 * Run in the background: pnpm --filter @naczas/api snapshot [--force]
 * ~600 requests at >= 1.1 s each (NFZ rate limit), so ~15 min. Resumable: existing files
 * are skipped unless --force.
 */
import { access } from 'node:fs/promises';
import path from 'node:path';

import { ProvinceCodeSchema } from '@naczas/shared';

import { selectAdultQueues } from '../src/aggregate/normalize';
import { allNfzBenefits } from '../src/exam-benefits';
import { createNfzClient, NfzUnavailableError } from '../src/nfz/client';
import { snapshotFile, writeSnapshot } from '../src/nfz/snapshot';

const DIR = path.resolve(import.meta.dirname, '../data/snapshot');
const force = process.argv.includes('--force');

const benefits = allNfzBenefits;
const provinces = ProvinceCodeSchema.options;
const nfz = createNfzClient({ minIntervalMs: 1100, timeoutMs: 15_000 });

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );

const failed: string[] = [];
for (const province of provinces) {
  for (const benefit of benefits) {
    if (!force && (await exists(snapshotFile(DIR, province, benefit)))) continue;
    try {
      const fetchedAt = new Date().toISOString();
      // Store exactly what the API serves (exact benefit, adult clinics); records without
      // coordinates are kept — the province-wide aggregate counts them (docs/05 §3).
      const queues = selectAdultQueues(await nfz.getQueues({ benefit, province }), [benefit]);
      const file = await writeSnapshot(DIR, { benefit, province, case: 1, fetchedAt }, queues);
      console.log(
        `${province} ${benefit}: ${queues.length} → ${path.relative(process.cwd(), file)}`,
      );
    } catch (err) {
      if (!(err instanceof NfzUnavailableError)) throw err;
      failed.push(`${province} ${benefit}`);
      console.warn(`FAILED ${province} ${benefit}: ${err.message}`);
    }
  }
}

if (failed.length > 0) {
  console.error(`Missing ${failed.length} entries — rerun to fill them in:\n${failed.join('\n')}`);
  process.exitCode = 1;
}
