import { useMemo } from 'react';

import { visitPrepSummary } from '@naczas/rules';
import type { VisitPrepSummary } from '@naczas/rules';
import type { ISODate } from '@naczas/shared';

import { usePlanData } from '@/features/plan/use-plan-data';
import { recordsForProfile, useRecordsStore } from '@/store';

export interface VisitPrepData {
  summary: VisitPrepSummary;
  today: ISODate;
}

/** Visit prep for the active profile: its plan (via usePlan), records and the app's today. */
export function useVisitPrep(): VisitPrepData | null {
  const { activeProfile, plan, today } = usePlanData();
  const allRecords = useRecordsStore((s) => s.records);

  return useMemo(() => {
    if (!activeProfile || !plan) return null;
    const records = recordsForProfile(allRecords, activeProfile.id);
    return {
      summary: visitPrepSummary({ profile: activeProfile, plan, today, records }),
      today,
    };
  }, [activeProfile, plan, today, allRecords]);
}
