import { describe, expect, it } from 'vitest';

import { CoverageSchema } from '../src';

const sample = {
  program: 'mammography',
  level: 'powiat',
  areaName: 'Warszawa',
  percent: 31.2,
  eligible: 417773,
  covered: 130551,
  asOf: '2026-10-01',
  source:
    'https://www.nfz.gov.pl/download/gfx/nfz/pl/defaultstronaopisowa/483/144/1/mammografia_1.10.2026_r..xlsx',
};

describe('CoverageSchema', () => {
  it('parses a /v1/coverage payload', () => {
    expect(CoverageSchema.parse(sample)).toEqual(sample);
    const { covered: _covered, ...withoutCovered } = sample;
    expect(CoverageSchema.safeParse(withoutCovered).success).toBe(true);
  });

  it('rejects unknown programmes, levels and out-of-range percentages', () => {
    expect(CoverageSchema.safeParse({ ...sample, program: 'flu' }).success).toBe(false);
    expect(CoverageSchema.safeParse({ ...sample, level: 'city' }).success).toBe(false);
    expect(CoverageSchema.safeParse({ ...sample, percent: 120 }).success).toBe(false);
    expect(CoverageSchema.safeParse({ ...sample, asOf: '1.10.2026' }).success).toBe(false);
  });
});
