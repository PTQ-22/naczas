import { useEffect } from 'react';

import { isTaskActive, useCallTasksStore, useStoresHydrated, type CallTask } from '@/store';

import { pollTask } from './call-tasks';

const TICK_MS = 1500;
/** A retry far in the future doesn't need second-by-second polling. */
const SLOW_POLL_MS = 30_000;
const lastPolled = new Map<string, number>();

function due(task: CallTask, now: number): boolean {
  const nextAt = task.attempt?.nextAt ? Date.parse(task.attempt.nextAt) : NaN;
  const slow = task.status === 'retry_scheduled' && nextAt - now > SLOW_POLL_MS;
  return !slow || now - (lastPolled.get(task.id) ?? 0) >= SLOW_POLL_MS;
}

/**
 * Keeps every active "Zadzwoń za mnie" task up to date while the app is open — on any screen —
 * so a booked visit lands in the plan even if the call screen was closed.
 */
export function CallTasksSync() {
  const hydrated = useStoresHydrated();
  const active = useCallTasksStore((s) => s.tasks.some(isTaskActive));

  useEffect(() => {
    if (!hydrated || !active) return;
    let running = false;
    const id = setInterval(() => {
      if (running) return; // a slow API: never stack polls
      running = true;
      const now = Date.now();
      const tasks = useCallTasksStore
        .getState()
        .tasks.filter((t) => isTaskActive(t) && due(t, now));
      for (const t of tasks) lastPolled.set(t.id, now);
      void Promise.all(tasks.map((t) => pollTask(t.id, now))).finally(() => {
        running = false;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [hydrated, active]);

  return null;
}
