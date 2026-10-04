import type { CallAssistRequest, CallAssistStatus } from '@naczas/shared';

import { notifyAgentBooked } from '@/notifications';
import { api } from '@/services';
import { ApiRequestError } from '@/services/api';
import { useCallTasksStore, useProfilesStore, useRecordsStore, type CallTask } from '@/store';

/** Post-call extraction usually lands within seconds; then the task is closed without it. */
const MAX_ANALYSIS_POLLS = 20;
const analysisPolls = new Map<string, number>();

/** Nothing about this status can change any more. */
export function isFinal(status: CallAssistStatus, id: string): boolean {
  if (status.status === 'failed' || status.status === 'cancelled') return true;
  if (status.status !== 'ended') return false;
  if (status.result !== null) return true;
  const n = (analysisPolls.get(id) ?? 0) + 1;
  analysisPolls.set(id, n);
  return n > MAX_ANALYSIS_POLLS;
}

/** Stores the status and, the first time a visit is booked, writes it to the plan. */
export function applyStatus(task: CallTask, status: CallAssistStatus, now: number) {
  const store = useCallTasksStore.getState();
  store.applyStatus(task.id, status, now, isFinal(status, task.id));
  const { result } = status;
  if (result?.booked && result.date && !task.applied) {
    useRecordsStore
      .getState()
      .markBooked(task.profileId, task.examId, result.date, result.time ?? undefined);
    store.markApplied(task.id);
    const profile = useProfilesStore.getState().profiles.find((p) => p.id === task.profileId);
    notifyAgentBooked({
      callId: task.id,
      examId: task.examId,
      profileName: profile?.name ?? '',
      facilityName: task.facilityName,
      date: result.date,
      time: result.time ?? undefined,
    }).catch(() => undefined); // a missed banner must never break saving the booking
  }
}

export interface StartCallInput {
  request: CallAssistRequest;
  profileId: string;
  examId: string;
  facilityName: string;
}

/** Hands the call to the agent; returns the task id ("Moje zlecenia"). */
export async function startCallTask(input: StartCallInput, now = Date.now()): Promise<string> {
  const { callId, mode } = await api.startCallAssist(input.request, { timeoutMs: 20_000 });
  useCallTasksStore.getState().add(
    {
      id: callId,
      mode,
      profileId: input.profileId,
      examId: input.examId,
      facilityName: input.facilityName,
    },
    now,
  );
  return callId;
}

const current = (id: string) => useCallTasksStore.getState().tasks.find((t) => t.id === id);

/** One status poll. An id the server no longer knows (restart, expired) closes the task. */
export async function pollTask(id: string, now = Date.now()): Promise<void> {
  const task = current(id);
  if (!task || task.closed) return;
  try {
    const status = await api.getCallAssist(id);
    const fresh = current(id);
    if (fresh) applyStatus(fresh, status, now);
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) {
      useCallTasksStore
        .getState()
        .applyStatus(id, { ...toStatus(task), status: 'failed' }, now, true);
    }
    // Network hiccup: keep the task, the next tick tries again.
  }
}

export async function retryTaskNow(id: string, now = Date.now()): Promise<void> {
  const task = current(id);
  if (!task) return;
  applyStatus(task, await api.retryCallAssistNow(id), now);
}

export async function cancelTask(id: string, now = Date.now()): Promise<void> {
  const task = current(id);
  if (!task) return;
  applyStatus(task, await api.cancelCallAssist(id), now);
}

export const toStatus = (t: CallTask): CallAssistStatus => ({
  callId: t.id,
  status: t.status,
  transcript: t.transcript,
  result: t.result,
  attempt: t.attempt,
  stats: t.stats,
});
