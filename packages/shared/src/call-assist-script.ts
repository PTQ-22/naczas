import type { CallAssistRequest, CallAssistStatus } from './api';
import type { ISODate } from './domain';

/**
 * Scripted "Zadzwoń za mnie" conversation, used when no voice provider is configured (API) and
 * in the mobile mock client — the demo must work offline and on web. Lives in shared so both
 * sides tell the same story.
 */

const MONTHS_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];

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

function spokenDate(date: ISODate): string {
  const [, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS_GENITIVE[(month ?? 1) - 1]}`;
}

interface ScriptLine {
  atMs: number;
  role: 'agent' | 'clinic';
  text: string;
}

const RINGING_UNTIL_MS = 2500;
export const SIMULATED_CALL_DURATION_MS = 23_000;

function script(req: CallAssistRequest, slot: ISODate): ScriptLine[] {
  const when = `${spokenDate(slot)} o ${SIMULATED_SLOT_TIME}`;
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
      text: 'Tak, jest e-skierowanie. Jaki jest najbliższy wolny termin?',
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
  const slot = simulatedSlotDate(today);
  const transcript = script(req, slot)
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
    result: { booked: true, date: slot, time: SIMULATED_SLOT_TIME, note: null },
  };
}
