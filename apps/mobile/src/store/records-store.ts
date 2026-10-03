import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ExamRecordSchema, type ExamRecord, type ISODate } from '@naczas/shared';

import { validatedPersist } from './persist';
import { currentToday } from './use-today';

const PersistedRecordsSchema = z.object({
  records: z.array(ExamRecordSchema),
  intervalOverrides: z.record(z.string(), z.number()).optional().default({}),
});
type PersistedRecords = z.infer<typeof PersistedRecordsSchema>;

interface RecordsState extends PersistedRecords {
  /**
   * Record before the last status change, per `recordKey` (null = there was none). One step,
   * in memory only — backs the "Cofnij" right after an action, not a history.
   */
  undoStack: Record<string, ExamRecord | null>;
  /** Inserts or replaces the record for (profileId, examId) — at most one per pair. */
  upsertRecord: (record: ExamRecord) => void;
  /** "Umówiłem/am się na …" — keeps lastDone, the plan reminds the day before. */
  markBooked: (profileId: string, examId: string, bookedFor: ISODate) => void;
  /** "Zrobione" on `date` — becomes lastDone, clears a booking. */
  markDone: (profileId: string, examId: string, date: ISODate) => void;
  /** Corrects when the exam was last done; status stays as it is. */
  setLastDone: (profileId: string, examId: string, lastDone: ExamRecord['lastDone']) => void;
  /** Sets custom interval for an exam. Key is profileId|examId */
  setIntervalOverride: (profileId: string, examId: string, months: number | null) => void;
  /** Reverts the last markBooked/markDone/setLastDone for this exam. Returns false if none. */
  undo: (profileId: string, examId: string) => boolean;
  removeRecordsForProfile: (profileId: string) => void;
  reset: () => void;
}

export const recordKey = (profileId: string, examId: string) => `${profileId}|${examId}`;

const sameKey = (a: ExamRecord, b: Pick<ExamRecord, 'profileId' | 'examId'>) =>
  a.profileId === b.profileId && a.examId === b.examId;

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set, get) => {
      /** Applies a change to one exam's record and remembers the previous version for undo. */
      const change = (
        profileId: string,
        examId: string,
        apply: (previous: ExamRecord | undefined) => ExamRecord,
      ) =>
        set((s) => {
          const previous = s.records.find((r) => sameKey(r, { profileId, examId }));
          const next = apply(previous);
          return {
            records: [...s.records.filter((r) => !sameKey(r, next)), next],
            undoStack: { ...s.undoStack, [recordKey(profileId, examId)]: previous ?? null },
          };
        });

      return {
        records: [],
        intervalOverrides: {},
        undoStack: {},
        upsertRecord: (record) =>
          set((s) => ({ records: [...s.records.filter((r) => !sameKey(r, record)), record] })),
        markBooked: (profileId, examId, bookedFor) =>
          change(profileId, examId, (previous) => ({
            profileId,
            examId,
            ...(previous?.lastDone !== undefined && { lastDone: previous.lastDone }),
            status: 'booked',
            bookedFor,
            updatedAt: currentToday(),
          })),
        markDone: (profileId, examId, date) =>
          change(profileId, examId, () => ({
            profileId,
            examId,
            lastDone: date,
            status: 'done',
            updatedAt: currentToday(),
          })),
        setLastDone: (profileId, examId, lastDone) =>
          change(profileId, examId, (previous) => {
            const { lastDone: _old, ...rest } = previous ?? { status: 'none' as const };
            return {
              ...rest,
              profileId,
              examId,
              ...(lastDone !== undefined && { lastDone }),
              updatedAt: currentToday(),
            };
          }),
        setIntervalOverride: (profileId, examId, months) =>
          set((s) => {
            const key = recordKey(profileId, examId);
            const { [key]: _, ...rest } = s.intervalOverrides || {};
            return {
              intervalOverrides: months === null ? rest : { ...s.intervalOverrides, [key]: months },
            };
          }),
        undo: (profileId, examId) => {
          const key = recordKey(profileId, examId);
          if (!(key in get().undoStack)) return false;
          set((s) => {
            const { [key]: previous, ...undoStack } = s.undoStack;
            const others = s.records.filter((r) => !sameKey(r, { profileId, examId }));
            return { records: previous ? [...others, previous] : others, undoStack };
          });
          return true;
        },
        removeRecordsForProfile: (profileId) =>
          set((s) => ({ records: s.records.filter((r) => r.profileId !== profileId) })),
        reset: () => set({ records: [], undoStack: {} }),
      };
    },
    validatedPersist<RecordsState, PersistedRecords>({
      name: 'records',
      version: 1,
      schema: PersistedRecordsSchema,
      partialize: ({ records, intervalOverrides }) => ({ records, intervalOverrides }),
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
