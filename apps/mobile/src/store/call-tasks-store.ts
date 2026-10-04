import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CallAssistStatusSchema, type CallAssistStatus } from '@naczas/shared';

import { validatedPersist } from './persist';

/**
 * "Moje zlecenia": every "Zadzwoń za mnie" the agent works on, with the last status the API
 * reported. Kept on the device so a call keeps going (and books the plan) after the screen is
 * closed, and so the "time saved" summary survives restarts.
 */
const CallTaskSchema = z.object({
  id: z.string(),
  mode: z.enum(['live', 'simulated']),
  profileId: z.string(),
  examId: z.string(),
  facilityName: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  status: CallAssistStatusSchema.shape.status,
  attempt: CallAssistStatusSchema.shape.attempt,
  stats: CallAssistStatusSchema.shape.stats,
  result: CallAssistStatusSchema.shape.result,
  transcript: CallAssistStatusSchema.shape.transcript,
  /** The booked date was written to the plan (once) */
  applied: z.boolean(),
  /** Nothing more will change — no more polling */
  closed: z.boolean(),
});
export type CallTask = z.infer<typeof CallTaskSchema>;

const PersistedSchema = z.object({ tasks: z.array(CallTaskSchema) });
type Persisted = z.infer<typeof PersistedSchema>;

export type NewCallTask = Pick<CallTask, 'id' | 'mode' | 'profileId' | 'examId' | 'facilityName'>;

interface CallTasksState extends Persisted {
  add: (task: NewCallTask, now: number) => void;
  /** Writes a status from the API; `closed` marks the task as finished. */
  applyStatus: (id: string, status: CallAssistStatus, now: number, closed: boolean) => void;
  markApplied: (id: string) => void;
  remove: (id: string) => void;
  removeProfile: (profileId: string) => void;
  reset: () => void;
}

/** Keep the device store small: older finished tasks fall off (their minutes stay counted). */
const MAX_TASKS = 50;

export const useCallTasksStore = create<CallTasksState>()(
  persist(
    (set) => {
      const update = (id: string, patch: (t: CallTask) => Partial<CallTask>) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch(t) } : t)) }));
      return {
        tasks: [],
        add: (task, now) =>
          set((s) => {
            const fresh: CallTask = {
              ...task,
              createdAt: now,
              updatedAt: now,
              status: 'queued',
              result: null,
              transcript: [],
              applied: false,
              closed: false,
            };
            return {
              tasks: [fresh, ...s.tasks.filter((t) => t.id !== task.id)].slice(0, MAX_TASKS),
            };
          }),
        applyStatus: (id, status, now, closed) =>
          update(id, () => ({
            status: status.status,
            attempt: status.attempt,
            stats: status.stats,
            result: status.result,
            transcript: status.transcript,
            updatedAt: now,
            closed,
          })),
        markApplied: (id) => update(id, () => ({ applied: true })),
        remove: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
        removeProfile: (profileId) =>
          set((s) => ({ tasks: s.tasks.filter((t) => t.profileId !== profileId) })),
        reset: () => set({ tasks: [] }),
      };
    },
    validatedPersist<CallTasksState, Persisted>({
      name: 'call-tasks',
      version: 1,
      schema: PersistedSchema,
      partialize: ({ tasks }) => ({ tasks }),
    }),
  ),
);

/** Phone time the agent spent instead of the user, over all tasks. */
export function savedTime(tasks: readonly CallTask[]) {
  let waitedSec = 0;
  let talkedSec = 0;
  let attempts = 0;
  for (const t of tasks) {
    waitedSec += t.stats?.waitedSec ?? 0;
    talkedSec += t.stats?.talkedSec ?? 0;
    attempts += t.stats?.attempts ?? 0;
  }
  const booked = tasks.filter((t) => t.result?.booked && t.result.date).length;
  return { waitedSec, talkedSec, totalSec: waitedSec + talkedSec, attempts, booked };
}

export const isTaskActive = (t: CallTask) => !t.closed;
