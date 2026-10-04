import { DEFAULT_CALL_RETRY, type CallAssistRequest, type CallAssistStatus } from './api';
import {
  describeBlocked,
  firstAvailableSlot,
  hasFreeHours,
  isBlocked,
  slotFits,
  spokenDate,
} from './availability';

import type { ISODate, TimeOfDay } from './domain';

/**
 * Scripted "Zadzwoń za mnie" conversation, used when no voice provider is configured (API) and
 * in the mobile mock client — the demo must work offline and on web. Lives in shared so both
 * sides tell the same story.
 */

export const SIMULATED_SLOT_TIME = '10:30';

/** Opening line — the AI disclosure (AI Act art. 50) is always the first sentence. */
export function callAssistOpening(req: CallAssistRequest): string {
  return `Dzień dobry, jestem asystentem AI dzwoniącym w imieniu ${req.callerName}. Chciałabym zapisać ${req.forWhom} na NFZ, na badanie: ${req.examName}.`;
}

/** Two weeks out, moved off the weekend — a plausible "first free slot". */
export function simulatedSlotDate(today: ISODate): ISODate {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 14);
  const day = d.getUTCDay();
  if (day === 6) d.setUTCDate(d.getUTCDate() + 2);
  if (day === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface ScriptLine {
  /** ms after the clinic picked up */
  atMs: number;
  role: 'agent' | 'clinic';
  text: string;
}

/**
 * The simulation is labelled as such and the jury has little time, so the whole story runs this
 * many times faster than a natural call (~15 s instead of ~45 s). The script below keeps natural
 * timings; `fast` compresses them in one place.
 */
export const SIMULATION_SPEEDUP = 3;
const fast = (ms: number) => Math.round(ms / SIMULATION_SPEEDUP);

/** Simulated timeline (ms from the start of an attempt). */
const RINGING_UNTIL_MS = fast(2500);
/** Answered, then IVR / hold music until a person speaks */
const ANSWERED_AT_MS = fast(7500);
/** The first attempt of a demo is never answered — it shows the re-dial */
export const UNANSWERED_RING_MS = fast(6000);
/** Real retries wait `intervalMin` (10 min); the demo compresses that to a few seconds. */
export const SIMULATED_RETRY_INTERVAL_MS = fast(8000);
/** Talk time after pick-up: plain booking / with a counter-proposal */
const TALK_MS = fast(21_500);
const NEGOTIATED_TALK_MS = fast(28_500);

interface Slot {
  date: ISODate;
  time: TimeOfDay;
}

/** What the simulated clinic offers first: its usual slot, two weeks out. */
const clinicOffer = (today: ISODate): Slot => ({
  date: simulatedSlotDate(today),
  time: SIMULATED_SLOT_TIME,
});

/**
 * The slot the call ends up booking. Without a calendar it is the clinic's offer; with one, the
 * offer is checked against it and — when it doesn't fit — the agent's counter-proposal (the first
 * time from then on that fits) is booked instead, so the demo shows the negotiation.
 */
export function simulatedSlot(req: CallAssistRequest, today: ISODate): Slot {
  const offer = clinicOffer(today);
  const av = req.availability;
  if (!av || slotFits(av, offer.date, offer.time)) return offer;
  if (hasFreeHours(av)) {
    const fits = firstAvailableSlot(av, offer.date);
    if (fits) return fits;
  }
  // Only "can't" hours marked: the clinic's usual time, on the first day it isn't blocked.
  let date = offer.date;
  for (let i = 0; i < 60 && isBlocked(av, date, offer.time); i++) date = nextDay(date);
  return { date, time: offer.time };
}

function nextDay(date: ISODate): ISODate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const spokenSlot = (slot: Slot) => `${spokenDate(slot.date)} o ${slot.time}`;

function script(req: CallAssistRequest, today: ISODate, offer: Slot, booked: Slot): ScriptLine[] {
  return naturalScript(req, today, offer, booked).map((l) => ({ ...l, atMs: fast(l.atMs) }));
}

/** The conversation at natural speaking pace (compressed by `script`). */
function naturalScript(
  req: CallAssistRequest,
  today: ISODate,
  offer: Slot,
  booked: Slot,
): ScriptLine[] {
  const when = spokenSlot(booked);
  const opening: ScriptLine[] = [
    { atMs: 0, role: 'clinic', text: 'Rejestracja, słucham.' },
    { atMs: 1500, role: 'agent', text: callAssistOpening(req) },
    { atMs: 5500, role: 'clinic', text: 'Dzień dobry. A jest skierowanie?' },
    {
      atMs: 8500,
      role: 'agent',
      text: 'Tak, jest e-skierowanie. Jaki jest najbliższy wolny termin?',
    },
    { atMs: 12_500, role: 'clinic', text: `Mam wolne ${spokenSlot(offer)}.` },
  ];
  const confirm = (atMs: number): ScriptLine[] => [
    {
      atMs,
      role: 'agent',
      text: `Świetnie, potwierdzam: ${when}. Dane osobowe zostaną podane przy rejestracji na miejscu. Dziękuję, do widzenia.`,
    },
    { atMs: atMs + 3500, role: 'clinic', text: 'Do widzenia.' },
  ];
  if (offer.date === booked.date && offer.time === booked.time)
    return [...opening, ...confirm(16_000)];

  // The offer clashes with the calendar: decline, say why, propose a time that fits.
  const blocked = req.availability ? describeBlocked(req.availability, today) : [];
  const why =
    req.availability && isBlocked(req.availability, offer.date, offer.time)
      ? 'wtedy na pewno nie damy rady'
      : 'to poza godzinami, w których możemy przyjść';
  return [
    ...opening,
    {
      atMs: 16_000,
      role: 'agent',
      text: `Niestety ${why}. Sprawdziłam kalendarz — czy byłoby możliwe ${when}?${
        blocked.length ? ` Na pewno nie możemy: ${blocked.join('; ')}.` : ''
      }`,
    },
    { atMs: 20_000, role: 'clinic', text: `Chwileczkę… Tak, ${when} jest wolne.` },
    ...confirm(23_000),
  ];
}

/**
 * A simulated "Zadzwoń za mnie" task: one or more dial attempts. Pure data + pure functions of
 * `now`, so the API and the app's offline mock run the very same story.
 */
export interface SimulatedCallTask {
  req: CallAssistRequest;
  today: ISODate;
  maxAttempts: number;
  /** Start of each attempt (ms epoch); the first one is the task's start */
  attemptStarts: number[];
  cancelledAt: number | null;
}

export function createSimulatedCallTask(
  req: CallAssistRequest,
  today: ISODate,
  now: number,
): SimulatedCallTask {
  const maxAttempts = (req.retry ?? DEFAULT_CALL_RETRY).maxAttempts;
  return { req, today, maxAttempts, attemptStarts: [now], cancelledAt: null };
}

/** The demo's first attempt rings out — unless there is no second attempt to show. */
const answered = (task: SimulatedCallTask, index: number) => index > 0 || task.maxAttempts === 1;

function talkMs(task: SimulatedCallTask): number {
  const offer = clinicOffer(task.today);
  const slot = simulatedSlot(task.req, task.today);
  return offer.date === slot.date && offer.time === slot.time ? TALK_MS : NEGOTIATED_TALK_MS;
}

/** Starts every attempt that is due by `now` (an unanswered attempt is followed by a retry). */
function settle(task: SimulatedCallTask, now: number): SimulatedCallTask {
  const until = task.cancelledAt ?? now;
  const starts = [...task.attemptStarts];
  for (;;) {
    const i = starts.length - 1;
    const start = starts[i] ?? 0;
    if (answered(task, i) || starts.length >= task.maxAttempts) break;
    const next = start + UNANSWERED_RING_MS + SIMULATED_RETRY_INTERVAL_MS;
    if (next > until) break;
    starts.push(next);
  }
  return starts.length === task.attemptStarts.length ? task : { ...task, attemptStarts: starts };
}

/** "Zadzwoń teraz" while a retry is scheduled: the next attempt starts at `now`. */
export function retrySimulatedCallNow(task: SimulatedCallTask, now: number): SimulatedCallTask {
  const settled = settle(task, now);
  const status = simulatedCallStatus('', settled, now).status;
  if (status !== 'retry_scheduled') return settled;
  return { ...settled, attemptStarts: [...settled.attemptStarts, now] };
}

export function cancelSimulatedCall(task: SimulatedCallTask, now: number): SimulatedCallTask {
  const settled = settle(task, now);
  const { status } = simulatedCallStatus('', settled, now);
  const finished = status === 'ended' || status === 'failed' || status === 'cancelled';
  return finished ? settled : { ...settled, cancelledAt: now };
}

/** Status of the task at `now`. Pure — no clock inside. */
export function simulatedCallStatus(
  callId: string,
  taskIn: SimulatedCallTask,
  nowIn: number,
): CallAssistStatus {
  const task = settle(taskIn, nowIn);
  const now = task.cancelledAt ?? nowIn;
  const index = task.attemptStarts.length - 1;
  const start = task.attemptStarts[index] ?? now;
  const elapsed = Math.max(0, now - start);
  const talk = talkMs(task);

  // Earlier attempts all rang out (only the last one can be answered).
  let waitedMs = index * UNANSWERED_RING_MS;
  let talkedMs = 0;
  if (answered(task, index)) {
    waitedMs += Math.min(elapsed, ANSWERED_AT_MS);
    talkedMs = Math.min(Math.max(0, elapsed - ANSWERED_AT_MS), talk);
  } else {
    waitedMs += Math.min(elapsed, UNANSWERED_RING_MS);
  }
  const base = {
    callId,
    stats: {
      attempts: task.attemptStarts.length,
      waitedSec: Math.round(waitedMs / 1000),
      talkedSec: Math.round(talkedMs / 1000),
    },
  };
  const attempt = (nextAt: number | null) => ({
    number: index + 1,
    max: task.maxAttempts,
    nextAt: nextAt === null ? null : new Date(nextAt).toISOString(),
  });

  if (!answered(task, index)) {
    const rangOut = elapsed >= UNANSWERED_RING_MS;
    const more = index + 1 < task.maxAttempts;
    const status = !rangOut
      ? 'ringing'
      : task.cancelledAt !== null
        ? 'cancelled'
        : more
          ? 'retry_scheduled'
          : 'failed';
    const nextAt =
      status === 'retry_scheduled'
        ? start + UNANSWERED_RING_MS + SIMULATED_RETRY_INTERVAL_MS
        : null;
    return {
      ...base,
      status: task.cancelledAt !== null ? 'cancelled' : status,
      transcript: [],
      result: null,
      attempt: attempt(nextAt),
    };
  }

  const offer = clinicOffer(task.today);
  const slot = simulatedSlot(task.req, task.today);
  const transcript = script(task.req, task.today, offer, slot)
    .filter((l) => l.atMs <= elapsed - ANSWERED_AT_MS)
    .map(({ role, text }) => ({ role, text }));
  const ended = elapsed >= ANSWERED_AT_MS + talk;
  if (ended) {
    return {
      ...base,
      status: 'ended',
      transcript,
      result: { booked: true, date: slot.date, time: slot.time, note: null },
      attempt: attempt(null),
    };
  }
  const status =
    task.cancelledAt !== null
      ? 'cancelled'
      : elapsed < RINGING_UNTIL_MS
        ? 'ringing'
        : elapsed < ANSWERED_AT_MS
          ? 'on_hold'
          : 'in_progress';
  return { ...base, status, transcript, result: null, attempt: attempt(null) };
}

/** One answered attempt, `elapsedMs` after dialling — the single-call view of the script. */
export function simulateCallAssist(
  callId: string,
  req: CallAssistRequest,
  today: ISODate,
  elapsedMs: number,
): CallAssistStatus {
  const task = createSimulatedCallTask(
    { ...req, retry: { maxAttempts: 1, intervalMin: 1 } },
    today,
    0,
  );
  return simulatedCallStatus(callId, task, elapsedMs);
}
