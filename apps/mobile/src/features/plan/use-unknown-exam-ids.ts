import { useMemo } from 'react';

import type { PlanItem } from '@naczas/shared';

import { useRecordsStore } from '@/store';

import { hasUnknownHistory } from './plan-view-model';

/** examIds of `items` whose last-done date we don't know for this profile. */
export function useUnknownExamIds(profileId: string, items: readonly PlanItem[]): Set<string> {
  const records = useRecordsStore((s) => s.records);
  return useMemo(() => {
    const own = records.filter((r) => r.profileId === profileId);
    return new Set(
      items
        .filter((i) => hasUnknownHistory(own.find((r) => r.examId === i.examId)))
        .map((i) => i.examId),
    );
  }, [records, profileId, items]);
}
