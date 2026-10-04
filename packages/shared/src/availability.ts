import { z } from 'zod';

import { ISODateSchema, TimeOfDaySchema, type ISODate, type TimeOfDay } from './domain';

/**
 * When the patient can come to a visit — marked by the user before "Zadzwoń za mnie", so the
 * voice agent asks only for slots that fit. Not health data: days and hours only (AGENTS.md §8).
 */

/** ISO weekday: 1 = Monday … 7 = Sunday */
export const WeekdaySchema = z.literal([1, 2, 3, 4, 5, 6, 7]);
export type Weekday = z.infer<typeof WeekdaySchema>;

const windowShape = { from: TimeOfDaySchema, to: TimeOfDaySchema };
const fromBeforeTo = (w: { from: string; to: string }) => w.from < w.to;
const FROM_BEFORE_TO = { message: '`from` must be before `to`' };

export const AvailabilityWindowSchema = z.object(windowShape).refine(fromBeforeTo, FROM_BEFORE_TO);
export type AvailabilityWindow = z.infer<typeof AvailabilityWindowSchema>;

const timeRulesShape = {
  /** Hours on given weekdays, e.g. Mon–Fri 17:00–20:00 */
  weekly: z
    .array(
      z
        .object({ days: z.array(WeekdaySchema).min(1).max(7), ...windowShape })
        .refine(fromBeforeTo, FROM_BEFORE_TO),
    )
    .max(50),
  /** One-off hours on specific days, on top of the weekly ones */
  dates: z
    .array(z.object({ date: ISODateSchema, ...windowShape }).refine(fromBeforeTo, FROM_BEFORE_TO))
    .max(200),
};
export const TimeRulesSchema = z.object(timeRulesShape);
export type TimeRules = z.infer<typeof TimeRulesSchema>;

export const CallAvailabilitySchema = z.object({
  /** When the patient is free (weekly + dates) */
  ...timeRulesShape,
  /** When the patient surely can't come — beats the free hours. Optional: older clients omit it. */
  blocked: TimeRulesSchema.optional(),
});
export type CallAvailability = z.infer<typeof CallAvailabilitySchema>;

const rulesEmpty = (r: TimeRules | undefined) =>
  !r || (r.weekly.length === 0 && r.dates.length === 0);

/** Nothing marked at all — any slot is fine. */
export const isAvailabilityEmpty = (av: CallAvailability) =>
  rulesEmpty(av) && rulesEmpty(av.blocked);

/** True when the user marked free hours (not only blocked ones). */
export const hasFreeHours = (av: CallAvailability) => !rulesEmpty(av);

/** ISO weekday of a 'YYYY-MM-DD' date, independent of the machine's time zone. */
export function isoWeekday(date: ISODate): Weekday {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return ([7, 1, 2, 3, 4, 5, 6] as const)[day] ?? 7;
}

const byFrom = (a: AvailabilityWindow, b: AvailabilityWindow) => a.from.localeCompare(b.from);

/** Windows of `rules` on `date`: the weekly ones plus that date's own (as in a calendar). */
function rulesOn(rules: TimeRules | undefined, date: ISODate): AvailabilityWindow[] {
  if (!rules) return [];
  const weekday = isoWeekday(date);
  return [
    ...rules.weekly.filter((w) => w.days.includes(weekday)),
    ...rules.dates.filter((d) => d.date === date),
  ]
    .map(({ from, to }) => ({ from, to }))
    .sort(byFrom);
}

/** `window` with every blocked window cut out — may split into several pieces or vanish. */
function subtract(window: AvailabilityWindow, blocked: readonly AvailabilityWindow[]) {
  let pieces = [window];
  for (const b of blocked) {
    pieces = pieces.flatMap((p) => {
      if (b.to <= p.from || b.from >= p.to) return [p];
      return [
        ...(b.from > p.from ? [{ from: p.from, to: b.from }] : []),
        ...(b.to < p.to ? [{ from: b.to, to: p.to }] : []),
      ];
    });
  }
  return pieces;
}

/** Hours the patient is free on `date`, minus the hours they marked as impossible. */
export function availabilityOn(av: CallAvailability, date: ISODate): AvailabilityWindow[] {
  const blocked = rulesOn(av.blocked, date);
  return rulesOn(av, date)
    .flatMap((w) => subtract(w, blocked))
    .sort(byFrom);
}

/** True when `time` on `date` falls into a blocked window. */
export function isBlocked(av: CallAvailability, date: ISODate, time: TimeOfDay): boolean {
  return rulesOn(av.blocked, date).some((w) => w.from <= time && time < w.to);
}

function addDays(date: ISODate, days: number): ISODate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** First day on or after `from` when the patient is free, and the start of that day's first window. */
export function firstAvailableSlot(
  av: CallAvailability,
  from: ISODate,
  horizonDays = 366,
): { date: ISODate; time: TimeOfDay } | null {
  for (let i = 0; i < horizonDays; i++) {
    const date = addDays(from, i);
    const [first] = availabilityOn(av, date);
    if (first) return { date, time: first.from };
  }
  return null;
}

/** Does `time` on `date` suit the patient? Free hours (if any were marked) and not blocked. */
export function slotFits(av: CallAvailability, date: ISODate, time: TimeOfDay): boolean {
  if (isBlocked(av, date, time)) return false;
  if (!hasFreeHours(av)) return true;
  return availabilityOn(av, date).some((w) => w.from <= time && time < w.to);
}

/**
 * The patient's calendar as concrete windows for the next `days` days — what the voice agent
 * checks every offer against and picks counter-proposals from. Blocked hours are already cut out.
 */
export function upcomingWindows(
  av: CallAvailability,
  from: ISODate,
  days = 21,
  max = 20,
): { date: ISODate; from: TimeOfDay; to: TimeOfDay }[] {
  const out: { date: ISODate; from: TimeOfDay; to: TimeOfDay }[] = [];
  for (let i = 0; i < days && out.length < max; i++) {
    const date = addDays(from, i);
    for (const w of availabilityOn(av, date)) out.push({ date, ...w });
  }
  return out.slice(0, max);
}

const WEEKDAYS_NOMINATIVE = [
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
  'niedziela',
];

/** "poniedziałek 19 października" */
export const spokenDayDate = (date: ISODate) =>
  `${WEEKDAYS_NOMINATIVE[isoWeekday(date) - 1]} ${spokenDate(date)}`;

const WEEKDAYS_PLURAL = [
  'poniedziałki',
  'wtorki',
  'środy',
  'czwartki',
  'piątki',
  'soboty',
  'niedziele',
];
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

function spokenDays(days: readonly Weekday[]): string {
  const set = [...new Set(days)].sort((a, b) => a - b);
  const key = set.join('');
  if (key === '1234567') return 'codziennie';
  if (key === '12345') return 'w dni robocze';
  if (key === '67') return 'w weekendy';
  return `w ${set.map((d) => WEEKDAYS_PLURAL[d - 1]).join(', ')}`;
}

/** "17:00–20:00", "17:00–20:00 i 7:00–9:00" */
const spokenWindows = (windows: readonly AvailabilityWindow[]) =>
  [...windows]
    .sort(byFrom)
    .map((w) => `${w.from}–${w.to}`)
    .join(' i ');

export function spokenDate(date: ISODate): string {
  const [, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS_GENITIVE[(month ?? 1) - 1]}`;
}

/**
 * Polish phrases for the voice agent, one per rule: "w dni robocze 17:00–20:00",
 * "21 października 9:00–12:00". Dates before `today` are left out — they can't be booked.
 */
function describeRules(rules: TimeRules, today: ISODate): string[] {
  const weekly = rules.weekly.map((w) => `${spokenDays(w.days)} ${w.from}–${w.to}`);
  const dates = [...new Set(rules.dates.map((d) => d.date))]
    .filter((date) => date >= today)
    .sort()
    .map(
      (date) => `${spokenDate(date)} ${spokenWindows(rules.dates.filter((d) => d.date === date))}`,
    );
  return [...weekly, ...dates];
}

export const describeAvailability = (av: CallAvailability, today: ISODate): string[] =>
  describeRules(av, today);

/** Same phrases for the hours the patient can't come. */
export const describeBlocked = (av: CallAvailability, today: ISODate): string[] =>
  av.blocked ? describeRules(av.blocked, today) : [];
