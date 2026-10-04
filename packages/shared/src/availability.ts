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

export const CallAvailabilitySchema = z.object({
  /** Usual free hours on given weekdays, e.g. Mon–Fri 17:00–20:00 */
  weekly: z
    .array(
      z
        .object({ days: z.array(WeekdaySchema).min(1).max(7), ...windowShape })
        .refine(fromBeforeTo, FROM_BEFORE_TO),
    )
    .max(50),
  /** One-off free hours on specific days, on top of the weekly ones */
  dates: z
    .array(z.object({ date: ISODateSchema, ...windowShape }).refine(fromBeforeTo, FROM_BEFORE_TO))
    .max(200),
});
export type CallAvailability = z.infer<typeof CallAvailabilitySchema>;

export const isAvailabilityEmpty = (av: CallAvailability) =>
  av.weekly.length === 0 && av.dates.length === 0;

/** ISO weekday of a 'YYYY-MM-DD' date, independent of the machine's time zone. */
export function isoWeekday(date: ISODate): Weekday {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return ([7, 1, 2, 3, 4, 5, 6] as const)[day] ?? 7;
}

const byFrom = (a: AvailabilityWindow, b: AvailabilityWindow) => a.from.localeCompare(b.from);

/** Hours the patient is free on `date`: the weekly ones plus that date's own (as in a calendar). */
export function availabilityOn(av: CallAvailability, date: ISODate): AvailabilityWindow[] {
  const weekday = isoWeekday(date);
  return [
    ...av.weekly.filter((w) => w.days.includes(weekday)),
    ...av.dates.filter((d) => d.date === date),
  ]
    .map(({ from, to }) => ({ from, to }))
    .sort(byFrom);
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
export function describeAvailability(av: CallAvailability, today: ISODate): string[] {
  const weekly = av.weekly.map((w) => `${spokenDays(w.days)} ${w.from}–${w.to}`);
  const dates = [...new Set(av.dates.map((d) => d.date))]
    .filter((date) => date >= today)
    .sort()
    .map((date) => `${spokenDate(date)} ${spokenWindows(av.dates.filter((d) => d.date === date))}`);
  return [...weekly, ...dates];
}
