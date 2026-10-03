import { useMemo } from 'react';

import { MOCK_TODAY, computePlan, mockProfileMama, visitPrepSummary } from '@naczas/rules';
import type { VisitPrepSummary } from '@naczas/rules';
import type { ISODate } from '@naczas/shared';

export interface VisitPrepData {
  summary: VisitPrepSummary;
  today: ISODate;
}

/**
 * TODO(WS3): replace the mock with the active profile, its records and wait times from the
 * store (useActiveProfile / usePlan) once they land in main.
 */
export function useVisitPrep(): VisitPrepData {
  return useMemo(() => {
    const today = MOCK_TODAY;
    const profile = mockProfileMama;
    const plan = computePlan({ profile, records: [], waitTimes: {}, today });
    return { summary: visitPrepSummary({ profile, plan, today, records: [] }), today };
  }, []);
}
