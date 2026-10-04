import {
  describeBlocked,
  firstAvailableSlot,
  hasFreeHours,
  isBlocked,
  slotFits,
  spokenDate,
} from './availability';

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
/** With a counter-proposal the call takes two more turns. */
export const SIMULATED_NEGOTIATED_CALL_DURATION_MS = 30_000;

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
  const when = spokenSlot(booked);
  const opening: ScriptLine[] = [
    { atMs: 3000, role: 'agent', text: callAssistOpening(req) },
    { atMs: 7000, role: 'clinic', text: 'Dzień dobry. A jest skierowanie?' },
    {
      atMs: 10_000,
      role: 'agent',
      text: 'Tak, jest e-skierowanie. Jaki jest najbliższy wolny termin?',
    },
    { atMs: 14_000, role: 'clinic', text: `Mam wolne ${spokenSlot(offer)}.` },
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
    return [...opening, ...confirm(17_500)];

  // The offer clashes with the calendar: decline, say why, propose a time that fits.
  const blocked = req.availability ? describeBlocked(req.availability, today) : [];
  const why =
    req.availability && isBlocked(req.availability, offer.date, offer.time)
      ? 'wtedy na pewno nie damy rady'
      : 'to poza godzinami, w których możemy przyjść';
  return [
    ...opening,
    {
      atMs: 17_500,
      role: 'agent',
      text: `Niestety ${why}. Sprawdziłam kalendarz — czy byłoby możliwe ${when}?${
        blocked.length ? ` Na pewno nie możemy: ${blocked.join('; ')}.` : ''
      }`,
    },
    { atMs: 21_500, role: 'clinic', text: `Chwileczkę… Tak, ${when} jest wolne.` },
    ...confirm(24_500),
  ];
}

/** State of the scripted call `elapsedMs` after it was started. Pure — no clock inside. */
export function simulateCallAssist(
  callId: string,
  req: CallAssistRequest,
  today: ISODate,
  elapsedMs: number,
): CallAssistStatus {
  const offer = clinicOffer(today);
  const slot = simulatedSlot(req, today);
  const negotiated = offer.date !== slot.date || offer.time !== slot.time;
  const duration = negotiated ? SIMULATED_NEGOTIATED_CALL_DURATION_MS : SIMULATED_CALL_DURATION_MS;
  const transcript = script(req, today, offer, slot)
    .filter((l) => l.atMs <= elapsedMs)
    .map(({ role, text }) => ({ role, text }));
  if (elapsedMs < RINGING_UNTIL_MS) return { callId, status: 'ringing', transcript, result: null };
  if (elapsedMs < duration) {
    return { callId, status: 'in_progress', transcript, result: null };
  }
  return {
    callId,
    status: 'ended',
    transcript,
    result: { booked: true, date: slot.date, time: slot.time, note: null },
  };
}
