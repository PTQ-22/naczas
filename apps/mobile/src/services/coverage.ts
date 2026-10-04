import { useEffect, useState } from 'react';

import type { Coverage, CoverageProgram, Profile } from '@naczas/shared';

import { roundCoord, type ApiClient } from './api';
import { api as defaultApi } from './client';

/** Exams that are an NFZ population programme with published coverage data (docs/04 §Coverage). */
const PROGRAM_BY_EXAM: Record<string, CoverageProgram> = {
  mammography: 'mammography',
  cervical_screening: 'cervical',
  colonoscopy_screening: 'colonoscopy',
};

export function coverageProgramFor(examId: string): CoverageProgram | undefined {
  return PROGRAM_BY_EXAM[examId];
}

type Location = NonNullable<Profile['location']>;

export function coverageKey(program: CoverageProgram, location: Location | undefined): string {
  return location
    ? [program, location.province, roundCoord(location.lat), roundCoord(location.lng)].join('|')
    : program;
}

/** Monthly data — one answer per program + place for the app's lifetime is plenty. */
const memory = new Map<string, Coverage>();

export function clearCoverageCache() {
  memory.clear();
}

/**
 * Regional screening coverage for the exam screen. Purely decorative context: any failure
 * (offline, timeout, no data) yields null and the card just doesn't render.
 */
export function useCoverage(
  examId: string,
  location: Location | undefined,
  api: Pick<ApiClient, 'getCoverage'> = defaultApi,
): Coverage | null {
  const program = coverageProgramFor(examId);
  const key = program ? coverageKey(program, location) : undefined;
  const [result, setResult] = useState<{ key: string; value: Coverage } | null>(null);
  const province = location?.province;
  const lat = location?.lat;
  const lng = location?.lng;

  useEffect(() => {
    if (!program || !key || memory.has(key)) return;
    const controller = new AbortController();
    api
      .getCoverage(
        {
          program,
          ...(province && lat !== undefined && lng !== undefined && { province, lat, lng }),
        },
        { signal: controller.signal, timeoutMs: 8000 },
      )
      .then((value) => {
        memory.set(key, value);
        setResult({ key, value });
      })
      .catch(() => undefined); // hidden on error — see doc comment
    return () => controller.abort();
  }, [api, key, program, province, lat, lng]);

  if (!key) return null;
  return memory.get(key) ?? (result?.key === key ? result.value : null);
}
