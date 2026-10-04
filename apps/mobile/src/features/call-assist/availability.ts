import { addDays, format, parseISO, startOfISOWeek } from 'date-fns';

import {
  isoWeekday,
  type CallAvailability,
  type ISODate,
  type TimeOfDay,
  type Weekday,
} from '@naczas/shared';

import { t } from '@/i18n';
import { slotKind, type Slot, type SlotKind } from '@/store/availability-store';

/** Rows of the week view: 7:00–21:00, typical clinic hours. */
export const DAY_START = 7 * 60;
export const DAY_END = 21 * 60;
/** Drag and the ± buttons snap to half hours. */
export const STEP = 30;

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

const pad = (n: number) => String(n).padStart(2, '0');
export const toTime = (minutes: number): TimeOfDay =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
export function toMinutes(time: TimeOfDay): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const weekStart = (date: ISODate): ISODate =>
  format(startOfISOWeek(parseISO(date)), 'yyyy-MM-dd');

export const weekDays = (start: ISODate): ISODate[] =>
  WEEKDAYS.map((_, i) => format(addDays(parseISO(start), i), 'yyyy-MM-dd'));

export const slotsOn = (slots: readonly Slot[], date: ISODate): Slot[] =>
  slots.filter((s) => (s.repeat === 'weekly' ? s.weekday === isoWeekday(date) : s.date === date));

/**
 * A drag from `a` to `b` minutes (either direction) as a block snapped outward to the half hour.
 * A tap (a ≈ b) gives a one-hour block, as a tap on an empty slot in Google Calendar does.
 */
export function rangeFromDrag(a: number, b: number): { from: TimeOfDay; to: TimeOfDay } {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  let from = clamp(Math.floor(lo / STEP) * STEP, DAY_START, DAY_END - STEP);
  let to = clamp(Math.ceil(hi / STEP) * STEP, from + STEP, DAY_END);
  if (hi - lo < STEP) {
    to = Math.min(from + 60, DAY_END);
    from = to - 60;
  }
  return { from: toTime(from), to: toTime(to) };
}

/** ± on the editor: moves one edge by `delta` minutes, keeping at least STEP in between. */
export function shiftEdge(slot: Slot, edge: 'from' | 'to', delta: number): Slot {
  const from = toMinutes(slot.from);
  const to = toMinutes(slot.to);
  return edge === 'from'
    ? { ...slot, from: toTime(clamp(from + delta, DAY_START, to - STEP)) }
    : { ...slot, to: toTime(clamp(to + delta, from + STEP, DAY_END)) };
}

/** "Powtarzaj co tydzień": `date` is the day the block was opened on, kept when switched off. */
export function withRepeat(slot: Slot, weekly: boolean, date: ISODate): Slot {
  const { id, from, to, kind } = slot;
  const base = { id, from, to, ...(kind && { kind }) };
  return weekly
    ? { ...base, repeat: 'weekly', weekday: isoWeekday(date) }
    : { ...base, repeat: 'once', date };
}

export const withKind = (slot: Slot, kind: SlotKind): Slot => ({ ...slot, kind });

const ofKind = (slots: readonly Slot[], kind: SlotKind) =>
  slots.filter((s) => slotKind(s) === kind);

/** Weekly blocks with the same hours, grouped: Mon 17–20 + Tue 17–20 → days [1, 2]. */
function weeklyGroups(slots: readonly Slot[]) {
  const groups = new Map<string, { days: Weekday[]; from: TimeOfDay; to: TimeOfDay }>();
  for (const s of slots) {
    if (s.repeat !== 'weekly') continue;
    const key = `${s.from}-${s.to}`;
    const group = groups.get(key) ?? { days: [], from: s.from, to: s.to };
    if (!group.days.includes(s.weekday)) group.days.push(s.weekday);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, days: [...g.days].sort((x, y) => x - y) }))
    .sort((x, y) => (x.days[0] ?? 0) - (y.days[0] ?? 0) || x.from.localeCompare(y.from));
}

/** What goes to the voice agent; undefined = nothing marked, take any slot. */
function toRules(slots: readonly Slot[], today: ISODate) {
  const weekly = weeklyGroups(slots);
  const dates = slots
    .flatMap((s) => (s.repeat === 'once' && s.date >= today ? [s] : []))
    .map(({ date, from, to }) => ({ date, from, to }))
    .sort((x, y) => x.date.localeCompare(y.date) || x.from.localeCompare(y.from));
  return { weekly, dates };
}

/** What goes to the voice agent: green blocks as free hours, red ones as `blocked`. */
export function toCallAvailability(
  slots: readonly Slot[],
  today: ISODate,
): CallAvailability | undefined {
  const free = toRules(ofKind(slots, 'free'), today);
  const busy = toRules(ofKind(slots, 'busy'), today);
  const hasBusy = busy.weekly.length > 0 || busy.dates.length > 0;
  if (!free.weekly.length && !free.dates.length && !hasBusy) return undefined;
  return hasBusy ? { ...free, blocked: busy } : free;
}

export const upcomingOnce = (slots: readonly Slot[], today: ISODate, kind: SlotKind = 'free') =>
  ofKind(slots, kind).filter((s) => s.repeat === 'once' && s.date >= today).length;

/** "Pn–Pt", "Weekendy", "Pn, Śr" */
export function daysLabel(days: readonly Weekday[]): string {
  const key = [...days].sort((x, y) => x - y).join('');
  if (key === '1234567') return t('callAssist.availability.everyDay');
  if (key === '12345') return t('callAssist.availability.workdays');
  if (key === '67') return t('callAssist.availability.weekends');
  return days.map((d) => t(`callAssist.availability.weekday.${d}`)).join(', ');
}

/** One line per group of weekly blocks: "Pn, Śr 10:00–15:00". */
export const weeklySummary = (slots: readonly Slot[], kind: SlotKind = 'free'): string[] =>
  weeklyGroups(ofKind(slots, kind)).map((g) => `${daysLabel(g.days)} ${g.from}–${g.to}`);
