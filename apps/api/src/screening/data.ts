import { readFileSync } from 'node:fs';
import path from 'node:path';

import { z } from 'zod';

import {
  CoverageProgramSchema,
  ISODateSchema,
  type Coverage,
  type CoverageProgram,
  type ProvinceCode,
} from '@naczas/shared';

export type { CoverageProgram };

const Count = z.number().int().nonnegative();
/** [name, eligible, covered] — tuples keep the committed JSON small (~3k areas × 3 programmes). */
const AreaSchema = z.tuple([z.string(), Count, Count]);
const AreasSchema = z.record(z.string(), AreaSchema);

const ProgramDataSchema = z.object({
  source: z.url(),
  country: z.tuple([Count, Count]),
  /** keyed by NFZ province code ('01'..'16' = ProvinceCode) */
  voivodeships: AreasSchema,
  /** keyed by 4-digit TERYT */
  powiats: AreasSchema,
  /** keyed by 6-digit TERYT (urban-rural parts merged) */
  gminas: AreasSchema,
});

export const CoverageDataSchema = z.object({
  asOf: ISODateSchema,
  pageUrl: z.url(),
  programs: z.partialRecord(CoverageProgramSchema, ProgramDataSchema),
});
export type CoverageData = z.infer<typeof CoverageDataSchema>;

export const COVERAGE_FILE = path.resolve(
  import.meta.dirname,
  '../../data/screening/coverage.json',
);

export function loadCoverageData(file = COVERAGE_FILE): CoverageData {
  return CoverageDataSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
}

/** Below this, a gmina's percentage swings too much on a few people — show its powiat instead. */
export const MIN_GMINA_ELIGIBLE = 1000;

export interface AreaQuery {
  /** 7-digit TERYT of the gmina (from ULDK), if resolved */
  teryt?: string;
  province?: ProvinceCode;
}

/** Most specific area with data: gmina → powiat → voivodeship → country. */
export function lookupCoverage(
  data: CoverageData,
  program: CoverageProgram,
  { teryt, province }: AreaQuery,
): Coverage | undefined {
  const p = data.programs[program];
  if (!p) return undefined;
  const build = (
    level: Coverage['level'],
    [areaName, eligible, covered]: [string, number, number],
  ) =>
    ({
      program,
      level,
      areaName,
      percent: eligible > 0 ? Math.round((covered / eligible) * 1000) / 10 : 0,
      eligible,
      covered,
      asOf: data.asOf,
      source: p.source,
    }) satisfies Coverage;

  const gmina = teryt ? p.gminas[teryt.slice(0, 6)] : undefined;
  if (gmina && gmina[1] >= MIN_GMINA_ELIGIBLE) return build('gmina', gmina);
  const powiat = teryt ? p.powiats[teryt.slice(0, 4)] : undefined;
  if (powiat) return build('powiat', powiat);
  const voivodeship = province ? p.voivodeships[province] : undefined;
  if (voivodeship) return build('voivodeship', voivodeship);
  return build('country', ['Polska', ...p.country]);
}
