import { describeAvailability, firstAvailableSlot, spokenDate } from './availability';

import type { CallAssistRequest, CallAssistStatus } from './api';
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
  atMs: number;
  role: 'agent' | 'clinic';
  text: string;
}

const RINGING_UNTIL_MS = 2500;
export const SIMULATED_CALL_DURATION_MS = 23_000;

interface Slot {
  date: ISODate;
  time: TimeOfDay;
}

/**
 * The clinic's "first free slot": two weeks out, or — when the user marked availability — the
 * first time from then on that fits it, so the demo shows the agent respecting the calendar.
 */
export function simulatedSlot(req: CallAssistRequest, today: ISODate): Slot {
  const base = simulatedSlotDate(today);
  const fits = req.availability && firstAvailableSlot(req.availability, base);
  return fits || { date: base, time: SIMULATED_SLOT_TIME };
}

function script(req: CallAssistRequest, today: ISODate, slot: Slot): ScriptLine[] {
  const when = `${spokenDate(slot.date)} o ${slot.time}`;
  const free = req.availability ? describeAvailability(req.availability, today) : [];
  return [
    {
      atMs: 3000,
      role: 'agent',
      text: callAssistOpening(req),
    },
    { atMs: 7000, role: 'clinic', text: 'Dzień dobry. A jest skierowanie?' },
    {
      atMs: 10_000,
      role: 'agent',
      text: free.length
        ? `Tak, jest e-skierowanie. Pasują nam terminy: ${free.join('; ')}. Co jest najbliżej?`
        : 'Tak, jest e-skierowanie. Jaki jest najbliższy wolny termin?',
    },
    { atMs: 14_000, role: 'clinic', text: `Mam wolne ${when}.` },
    {
      atMs: 17_500,
      role: 'agent',
      text: `Świetnie, potwierdzam: ${when}. Dane osobowe zostaną podane przy rejestracji na miejscu. Dziękuję, do widzenia.`,
    },
    { atMs: 21_000, role: 'clinic', text: 'Do widzenia.' },
  ];
}

/** State of the scripted call `elapsedMs` after it was started. Pure — no clock inside. */
export function simulateCallAssist(
  callId: string,
  req: CallAssistRequest,
  today: ISODate,
  elapsedMs: number,
): CallAssistStatus {
  const slot = simulatedSlot(req, today);
  const transcript = script(req, today, slot)
    .filter((l) => l.atMs <= elapsedMs)
    .map(({ role, text }) => ({ role, text }));
  if (elapsedMs < RINGING_UNTIL_MS) return { callId, status: 'ringing', transcript, result: null };
  if (elapsedMs < SIMULATED_CALL_DURATION_MS) {
    return { callId, status: 'in_progress', transcript, result: null };
  }
  return {
    callId,
    status: 'ended',
    transcript,
    result: { booked: true, date: slot.date, time: slot.time, note: null },
  };
}
