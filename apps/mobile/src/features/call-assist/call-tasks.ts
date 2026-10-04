import { format } from 'date-fns';

import { simulatedOutcome, type CallAssistRequest, type CallAssistStatus } from '@naczas/shared';

import { cancelAgentBooked, notifyAgentBooked, scheduleAgentBooked } from '@/notifications';
import { api } from '@/services';
import { ApiRequestError } from '@/services/api';
import { useCallTasksStore, useProfilesStore, useRecordsStore, type CallTask } from '@/store';

/** Post-call extraction usually lands within seconds; then the task is closed without it. */
const MAX_ANALYSIS_POLLS = 20;
const analysisPolls = new Map<string, number>();
/** Simulated tasks whose "booked" notification is already scheduled with the OS. */
const preScheduled = new Set<string>();

const profileName = (profileId: string) =>
  useProfilesStore.getState().profiles.find((p) => p.id === profileId)?.name ?? '';

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
    if (preScheduled.delete(task.id)) return; // the OS delivers it at the scripted moment
    notifyAgentBooked({
      callId: task.id,
      examId: task.examId,
      profileName: profileName(task.profileId),
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
  if (mode === 'simulated') void preScheduleBooked(callId, input, now);
  return callId;
}

/** The scripted story's ending is known now — schedule its notification (see scheduleAgentBooked). */
async function preScheduleBooked(callId: string, input: StartCallInput, now: number) {
  const outcome = simulatedOutcome(input.request, format(now, 'yyyy-MM-dd'), now);
  if (!outcome?.result.date) return;
  try {
    const scheduled = await scheduleAgentBooked(
      {
        callId,
        examId: input.examId,
        profileName: profileName(input.profileId),
        facilityName: input.facilityName,
        date: outcome.result.date,
        time: outcome.result.time ?? undefined,
      },
      outcome.endsAt,
    );
    if (scheduled) preScheduled.add(callId);
  } catch {
    // Falls back to notifying when the result arrives.
  }
}

/** The scripted ending changes: forget the pre-scheduled notification, notify on the result. */
function dropPreScheduled(id: string) {
  if (preScheduled.delete(id)) cancelAgentBooked(id).catch(() => undefined);
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
  dropPreScheduled(id);
  applyStatus(task, await api.retryCallAssistNow(id), now);
}

export async function cancelTask(id: string, now = Date.now()): Promise<void> {
  const task = current(id);
  if (!task) return;
  dropPreScheduled(id);
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
