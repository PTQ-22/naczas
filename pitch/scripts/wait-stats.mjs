// Median / p75 of NFZ-reported average waiting time per benefit and province, for pitch slide 2.
// Input: raw NFZ "Terminy leczenia" queue dumps committed by WS2 (case=1, stable queue).
// Usage: node pitch/scripts/wait-stats.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../apps/api/test/fixtures/queues',
);

// Linear interpolation between closest ranks (same as numpy's default / Excel PERCENTILE.INC),
// so the numbers can be re-checked in a spreadsheet.
const percentile = (sorted, p) => {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
};

// Keep one decimal: rounding 137.5 to a whole day would hide which method produced the number.
const round1 = (x) => Math.round(x * 10) / 10;

const rows = [];
for (const province of readdirSync(FIXTURES).sort()) {
  for (const file of readdirSync(join(FIXTURES, province)).sort()) {
    const dump = JSON.parse(readFileSync(join(FIXTURES, province, file), 'utf8'));
    const records = dump.pages.flatMap((page) => page.data);
    const declared = dump.pages[0].meta.count;
    const stats = records.map((r) => r.attributes.statistics?.['provider-data']);
    // average-period = 0 means the facility reported no data, not a zero-day wait (docs/04 §Pułapki).
    const periods = stats
      .map((s) => s?.['average-period'])
      .filter((v) => typeof v === 'number' && v > 0)
      .sort((a, b) => a - b);
    const updates = [...new Set(stats.map((s) => s?.update).filter(Boolean))].sort();
    rows.push({
      province,
      benefit: dump.request.benefit,
      records: `${records.length}/${declared}`,
      withData: periods.length,
      medianDays: periods.length ? round1(percentile(periods, 0.5)) : null,
      p75Days: periods.length ? round1(percentile(periods, 0.75)) : null,
      minDays: periods[0] ?? null,
      maxDays: periods.at(-1) ?? null,
      update: updates.join(','),
      fetchedAt: dump.fetchedAt,
    });
  }
}

process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
