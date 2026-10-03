import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ExamRecordSchema, type ExamRecord } from '@naczas/shared';

import { validatedPersist } from './persist';

const PersistedRecordsSchema = z.object({ records: z.array(ExamRecordSchema) });
type PersistedRecords = z.infer<typeof PersistedRecordsSchema>;

interface RecordsState extends PersistedRecords {
  /** Inserts or replaces the record for (profileId, examId) — at most one per pair. */
  upsertRecord: (record: ExamRecord) => void;
  removeRecordsForProfile: (profileId: string) => void;
  reset: () => void;
}

const sameKey = (a: ExamRecord, b: Pick<ExamRecord, 'profileId' | 'examId'>) =>
  a.profileId === b.profileId && a.examId === b.examId;

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set) => ({
      records: [],
      upsertRecord: (record) =>
        set((s) => ({ records: [...s.records.filter((r) => !sameKey(r, record)), record] })),
      removeRecordsForProfile: (profileId) =>
        set((s) => ({ records: s.records.filter((r) => r.profileId !== profileId) })),
      reset: () => set({ records: [] }),
    }),
    validatedPersist<RecordsState, PersistedRecords>({
      name: 'records',
      version: 1,
      schema: PersistedRecordsSchema,
      partialize: ({ records }) => ({ records }),
    }),
  ),
);

/** Not a selector for `useRecordsStore(...)` directly — filter returns a new array each call. */
export function recordsForProfile(records: ExamRecord[], profileId: string): ExamRecord[] {
  return records.filter((r) => r.profileId === profileId);
}

export function findRecord(
  records: ExamRecord[],
  profileId: string,
  examId: string,
): ExamRecord | undefined {
  return records.find((r) => sameKey(r, { profileId, examId }));
}
