import { useMemo } from 'react';

import { MOCK_TODAY, mockPlan, mockProfileMama } from '@naczas/rules';
import type { ISODate, Plan, Profile } from '@naczas/shared';

export interface PlanData {
  profiles: Profile[];
  activeProfile: Profile;
  plan: Plan;
  today: ISODate;
}

// TODO(WS3): replace with the store (`profiles`, `activeProfileId`) + `usePlan(profileId)` and
// `useToday()` once WS3-2/WS3-3 land. Kept as the single seam so PlanScreen doesn't change.
export function usePlanData(): PlanData {
  return useMemo(
    () => ({
      profiles: [mockProfileMama],
      activeProfile: mockProfileMama,
      plan: mockPlan({ today: MOCK_TODAY, profileId: mockProfileMama.id }),
      today: MOCK_TODAY,
    }),
    [],
  );
}
