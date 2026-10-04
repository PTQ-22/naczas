/**
 * NFZ "dane o realizacji programów" (monthly xlsx, one per programme) → data/screening/coverage.json.
 * Run: pnpm --filter @naczas/api coverage [--dir <folder with already downloaded xlsx>]
 * Update ISSUE and AS_OF when NFZ publishes a new month (links on PAGE_URL).
 *
 * Coverage = "wyłączonych – ogółem" / "kwalifikujących się" — the same formula NFZ uses for its
 * "Procent objęcia populacji [%]" column (checked per row below), so aggregates are true
 * population-weighted sums, never averages of percentages.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { readFirstSheet } from './xlsx-lite';
import { CoverageDataSchema, type CoverageData, type CoverageProgram } from '../src/screening/data';

const PAGE_URL =
  'https://www.nfz.gov.pl/dla-pacjenta/programy-profilaktyczne/dane-o-realizacji-programow/';
const ISSUE = 'https://www.nfz.gov.pl/download/gfx/nfz/pl/defaultstronaopisowa/483/144/1';
const AS_OF = '2026-10-01';
const FILES: Record<CoverageProgram, string> = {
  mammography: 'mammografia_1.10.2026_r..xlsx',
  cervical: 'hpv_hr_1.10.2026_r..xlsx',
  colonoscopy: 'kolonoskopia_1.10.2026_r..xlsx',
};
const OUT = path.resolve(import.meta.dirname, '../data/screening/coverage.json');

const dirArg = process.argv.indexOf('--dir');
const localDir = dirArg >= 0 ? process.argv[dirArg + 1] : undefined;

const LOWER_WORDS = new Set(['nad', 'pod', 'w', 'na', 'przy']);
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-.])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .split(' ')
    .map((w, i) => (i > 0 && LOWER_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w))
    .join(' ');
}
/** Land powiats are adjectives ("BOLESŁAWIECKI" → "powiat bolesławiecki"); cities keep their name. */
const powiatName = (s: string) =>
  /(SKI|CKI|DZKI)$/u.test(s) ? `powiat ${s.toLowerCase()}` : titleCase(s);

// \s also matches the NBSP NFZ uses as thousands separator ("9 151").
const num = (s: string | undefined) => Number((s ?? '').replace(/\s/g, ''));

type Area = [name: string, eligible: number, covered: number];
function add(map: Record<string, Area>, key: string, name: string, e: number, c: number) {
  const prev = map[key];
  map[key] = prev ? [prev[0], prev[1] + e, prev[2] + c] : [name, e, c];
}

async function load(file: string): Promise<Buffer> {
  if (localDir) return readFile(path.join(localDir, file));
  const res = await fetch(`${ISSUE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const data: CoverageData = { asOf: AS_OF, pageUrl: PAGE_URL, programs: {} };

for (const [program, file] of Object.entries(FILES) as [CoverageProgram, string][]) {
  const rows = readFirstSheet(await load(file));
  // Header cells use non-breaking spaces and dashes inconsistently — match on stems only.
  const header = rows.findIndex((r) => r[6]?.startsWith('kwalifikuj'));
  if (header < 0 || !/^wyłączonych\W+ogółem/u.test(rows[header]?.[7] ?? '')) {
    throw new Error(`${file}: unexpected header layout`);
  }
  const voivodeships: Record<string, Area> = {};
  const powiats: Record<string, Area> = {};
  const gminas: Record<string, Area> = {};
  let country: [number, number] = [0, 0];
  let total: [number, number] | undefined;

  for (const r of rows.slice(header + 1)) {
    const eligible = num(r[6]);
    const covered = num(r[7]);
    if (r[0] === 'RAZEM') {
      total = [eligible, covered];
      continue;
    }
    if (!Number.isFinite(eligible) || !Number.isFinite(covered) || !r[0]) continue;
    country = [country[0] + eligible, country[1] + covered];
    if (!/^\d+$/.test(r[0])) continue; // "BRAK DANYCH": counted nationally, no area

    const percent = num(r[r.length - 1]);
    if (eligible > 0 && Math.abs((covered / eligible) * 100 - percent) > 0.01) {
      throw new Error(`${file}: coverage formula mismatch in row ${r.join('|')}`);
    }
    const teryt = (r[4] ?? '').padStart(7, '0'); // file drops TERYT's leading zero
    // Urban-rural gminas come split into town (4) and rural area (5): merge by 6-digit TERYT.
    add(voivodeships, r[0].padStart(2, '0'), (r[1] ?? '').toLowerCase(), eligible, covered);
    add(powiats, teryt.slice(0, 4), powiatName(r[3] ?? ''), eligible, covered);
    add(gminas, teryt.slice(0, 6), titleCase(r[5] ?? ''), eligible, covered);
  }
  if (!total || total[0] !== country[0] || total[1] !== country[1]) {
    throw new Error(`${file}: rows don't add up to RAZEM`);
  }
  data.programs[program] = {
    source: `${ISSUE}/${file}`,
    country,
    voivodeships,
    powiats,
    gminas,
  };
  console.log(
    `${program}: ${Object.keys(gminas).length} gminas, ${Object.keys(powiats).length} powiats, ` +
      `country ${((country[1] / country[0]) * 100).toFixed(2)}%`,
  );
}

await writeFile(OUT, JSON.stringify(CoverageDataSchema.parse(data)) + '\n');
console.log(`→ ${path.relative(process.cwd(), OUT)}`);
