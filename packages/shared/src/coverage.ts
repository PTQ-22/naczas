import { z } from 'zod';

import { ISODateSchema } from './domain';

/** NFZ population screening programmes with published coverage data. */
export const CoverageProgramSchema = z.enum(['mammography', 'cervical', 'colonoscopy']);
export type CoverageProgram = z.infer<typeof CoverageProgramSchema>;

export const CoverageLevelSchema = z.enum(['gmina', 'powiat', 'voivodeship', 'country']);
export type CoverageLevel = z.infer<typeof CoverageLevelSchema>;

/**
 * GET /v1/coverage — share of the programme's eligible population in an area that NFZ counts as
 * covered (screened in the programme or under specialist care). A regional statistic, never a
 * personal risk figure (AGENTS.md §7).
 */
export const CoverageSchema = z.object({
  program: CoverageProgramSchema,
  level: CoverageLevelSchema,
  /** Nominative, display-ready: "Gromadka", "powiat bolesławiecki", "Warszawa", "mazowieckie", "Polska" */
  areaName: z.string(),
  percent: z.number().min(0).max(100), // 1 decimal
  eligible: z.number().int().nonnegative(),
  covered: z.number().int().nonnegative().optional(),
  asOf: ISODateSchema,
  /** URL of the NFZ xlsx the numbers come from */
  source: z.url(),
});
export type Coverage = z.infer<typeof CoverageSchema>;
