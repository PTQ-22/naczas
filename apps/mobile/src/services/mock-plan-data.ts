import type { ProvinceCode, WaitTimeSummary } from '@naczas/shared';

import type { WaitTimes } from './wait-times';

/** p75 values agreed with WS4 for the mock-mode plan screen (illustrative, not live NFZ data). */
const MOCK_P75_DAYS: Record<string, number> = {
  colonoscopy_screening: 213,
  eye_exam: 138,
  dental_checkup: 51,
  skin_check: 142,
};

export function mockWaitTimes(province: ProvinceCode): WaitTimes {
  return Object.fromEntries(
    Object.entries(MOCK_P75_DAYS).map(([examId, p75Days]): [string, WaitTimeSummary] => [
      examId,
      {
        examId,
        province,
        radiusKm: 15,
        facilitiesCount: 10,
        p50Days: null,
        p75Days,
        minDays: null,
        asOf: '2026-09',
        source: 'nfz_snapshot',
      },
    ]),
  );
}
