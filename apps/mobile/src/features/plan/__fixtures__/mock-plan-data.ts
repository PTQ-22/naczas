import { MOCK_TODAY, mockPlan, mockProfileMama } from '@naczas/rules';

import type { PlanData } from '../use-plan-data';

/** usePlanData() stub for screen tests — keeps WS3 store/network out of WS4 UI tests. */
export function mockPlanData(overrides: Partial<PlanData> = {}): PlanData {
  return {
    profiles: [mockProfileMama],
    activeProfile: mockProfileMama,
    plan: mockPlan({ today: MOCK_TODAY, profileId: mockProfileMama.id }),
    today: MOCK_TODAY,
    waitTimes: {},
    status: 'ready',
    selectProfile: jest.fn(),
    ...overrides,
  };
}
