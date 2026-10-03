import { MOCK_TODAY, mockPlan, mockProfileMama } from '@naczas/rules';

import type { PlanData } from '../use-plan-data';

/** usePlanData() stub for screen tests — keeps WS3 store/network out of WS4 UI tests. */
export function mockPlanData(overrides: Partial<PlanData> = {}): PlanData {
  return {
    profiles: [mockProfileMama],
    activeProfile: mockProfileMama,
    plan: mockPlan({ today: MOCK_TODAY, profileId: mockProfileMama.id }),
    today: MOCK_TODAY,
    // NFZ snapshot for colonoscopy in mazowieckie (p75 ≈ 30 weeks, coordinator's reference value).
    waitTimes: {
      colonoscopy_screening: {
        examId: 'colonoscopy_screening',
        province: '07',
        radiusKm: 25,
        facilitiesCount: 12,
        p50Days: 138,
        p75Days: 213,
        minDays: 21,
        asOf: '2026-09',
        source: 'nfz_snapshot',
      },
    },
    status: 'ready',
    selectProfile: jest.fn(),
    ...overrides,
  };
}
