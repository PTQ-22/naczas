import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

import { URGENCY_ORDER } from '@naczas/rules';
import type { BookingType, ExamRecord, PlanItem, Urgency, WaitTimeSummary } from '@naczas/shared';

import type { MessageKey, TranslateParams } from '@/i18n';

export interface PlanSection {
  urgency: Urgency;
  items: PlanItem[];
}

/** Sections in engine order (act_now → booked → this_year → later → done), empty ones dropped. */
export function groupSections(items: readonly PlanItem[]): PlanSection[] {
  const order = (Object.keys(URGENCY_ORDER) as Urgency[]).sort(
    (a, b) => URGENCY_ORDER[a] - URGENCY_ORDER[b],
  );
  return order
    .map((urgency) => ({ urgency, items: items.filter((i) => i.urgency === urgency) }))
    .filter((s) => s.items.length > 0);
}

/** Sections collapsed by default: done always; later too in senior mode (screens.md §2). */
export function isCollapsedByDefault(urgency: Urgency, seniorMode: boolean): boolean {
  return urgency === 'done' || (seniorMode && urgency === 'later');
}

export function waitWeeks(days: number): number {
  return Math.max(1, Math.round(days / 7));
}

/**
 * Weeks for "czeka się ok. N tyg." — only from the NFZ p75 wait. leadTimeDays is "when to start"
 * (wait + buffers), not a wait, so it is never shown as one (coordinator decision).
 */
export function queueWaitWeeks(summary?: WaitTimeSummary): number | null {
  return summary?.p75Days != null ? waitWeeks(summary.p75Days) : null;
}

export interface Message {
  key: MessageKey;
  params?: TranslateParams;
}

export type PluralForm = 'one' | 'few' | 'many';

/** Polish plural form: 1 / 2–4 (except 12–14) / everything else. */
export function pluralForm(n: number): PluralForm {
  if (n === 1) return 'one';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? 'few' : 'many';
}

/** Polish plural for "N badań wymaga działania" (1 / 2–4 / 5+, with 12–14 as "many"). */
export function summaryMessage(actNowCount: number): Message {
  const n = actNowCount;
  if (n === 0) return { key: 'plan.summary.none' };
  const form = pluralForm(n);
  if (form === 'one') return { key: 'plan.summary.one' };
  return { key: form === 'few' ? 'plan.summary.few' : 'plan.summary.many', params: { count: n } };
}

const monthYear = (iso: string) => format(parseISO(iso), 'MM.yyyy');
const fullDate = (iso: string) => format(parseISO(iso), 'dd.MM.yyyy');

/** "Zrób do: 12.2026" / "Umówione: 15.10.2026" / "Następne: ok. 2029". */
export function dateMessage(item: PlanItem): Message {
  switch (item.urgency) {
    case 'booked':
      return { key: 'plan.card.bookedFor', params: { date: fullDate(item.dueDate) } };
    case 'later':
    case 'done':
      return { key: 'plan.card.nextAround', params: { year: item.dueDate.slice(0, 4) } };
    default:
      return { key: 'plan.card.dueBy', params: { date: monthYear(item.dueDate) } };
  }
}

/** "Why now" line — only for items the user should act on and that depend on a queue. */
export function whyNowMessage(
  item: PlanItem,
  booking: BookingType,
  summary?: WaitTimeSummary,
): Message | null {
  if (booking !== 'queue') return null;
  if (item.urgency === 'act_now') {
    const weeks = queueWaitWeeks(summary);
    return weeks === null
      ? { key: 'plan.card.startEarly' }
      : { key: 'plan.card.whyNowQueue', params: { weeks } };
  }
  if (item.urgency === 'this_year') {
    return { key: 'plan.card.startFrom', params: { date: fullDate(item.notifyDate) } };
  }
  return null;
}

export type CtaAction = 'facilities' | 'exam' | 'markDone';

export interface PlanCta {
  action: CtaAction;
  variant: 'primary' | 'secondary';
  label: Message;
}

/**
 * One CTA per card, chosen by booking type (01-user-journey §UX). Only the first act_now card
 * gets the filled primary button — one primary per screen (tokens.md §6.3).
 */
export function planCta(
  item: PlanItem,
  booking: BookingType,
  isFirstActNow: boolean,
  summary?: WaitTimeSummary,
): PlanCta | null {
  const variant = isFirstActNow ? 'primary' : 'secondary';
  switch (item.urgency) {
    case 'done':
    case 'later':
      return null;
    case 'booked':
      return { action: 'markDone', variant, label: { key: 'plan.cta.markDone' } };
    default:
      break;
  }
  switch (booking) {
    case 'queue': {
      const weeks = queueWaitWeeks(summary);
      return {
        action: 'facilities',
        variant,
        label:
          weeks === null
            ? { key: 'plan.cta.findSlotPlain' }
            : { key: 'plan.cta.findSlot', params: { weeks } },
      };
    }
    case 'program':
      return { action: 'exam', variant, label: { key: 'plan.cta.program' } };
    case 'walk_in':
      return { action: 'markDone', variant, label: { key: 'plan.cta.walkIn' } };
  }
}

export function countActNow(items: readonly PlanItem[]): number {
  return items.filter((i) => i.urgency === 'act_now').length;
}

// ---- Redesign v2 „Numerek”: queue ticket + quiet list (docs/design/redesign.md §2, §4) ----

/**
 * The single ticket on the plan: among act_now items, the one with the longest NFZ queue — that is
 * where starting today changes the outcome (engine order breaks ties). With nothing urgent the
 * next this_year item still gets it, so the screen always leads with "what to do next".
 */
export function ticketItem(
  items: readonly PlanItem[],
  queueWeeks: (examId: string) => number | null = () => null,
): PlanItem | undefined {
  const urgent = items.filter((i) => i.urgency === 'act_now');
  const longest = urgent.reduce<PlanItem | undefined>(
    (best, i) =>
      best === undefined || (queueWeeks(i.examId) ?? -1) > (queueWeeks(best.examId) ?? -1)
        ? i
        : best,
    undefined,
  );
  return longest ?? items.find((i) => i.urgency === 'this_year');
}

/**
 * True when we don't know when the exam was last done: no record, or the "Kiedy ostatnio?"
 * question was left empty / answered "nie pamiętam". The engine schedules these from today, but
 * the plan must not present them as missed deadlines (docs/ux-review-first-run.md #1).
 */
export function hasUnknownHistory(record: ExamRecord | undefined): boolean {
  if (!record) return true;
  if (record.status !== 'none') return false;
  return record.lastDone === undefined || record.lastDone === 'unknown';
}

export interface PlanLayout {
  hero: PlanItem | undefined;
  /** act_now exams with unknown history — shown as a quiet "Kiedy ostatnio?" group. */
  unknown: PlanItem[];
  /** Everything else except the hero, in engine section order. */
  sections: PlanSection[];
  /** Known act_now exams (hero included) — the number on the profile badge. */
  actNowCount: number;
}

/** Splits a plan into hero / unknown-history group / urgency sections. */
export function planLayout(
  items: readonly PlanItem[],
  unknownExamIds: ReadonlySet<string>,
  queueWeeks?: (examId: string) => number | null,
): PlanLayout {
  const isUnknown = (i: PlanItem) => i.urgency === 'act_now' && unknownExamIds.has(i.examId);
  const known = items.filter((i) => !isUnknown(i));
  const hero = ticketItem(known, queueWeeks);
  return {
    hero,
    unknown: items.filter(isUnknown),
    sections: groupSections(known.filter((i) => i !== hero)),
    actNowCount: countActNow(known),
  };
}

export interface TicketContent {
  /** The big printed number: weeks in the queue, or the due month ("10.2026") without queue data. */
  value: string;
  /** Uppercase line under the number. */
  unit: Message;
  /** One sentence with the concrete next step. */
  message: Message;
  /** Accessible reading of value + unit ("29 tygodni w kolejce"). */
  a11yValue: Message;
}

// Genitive month name for sentences: "do października 2026" reads naturally and aloud.
const monthYearWords = (iso: string) => format(parseISO(iso), 'LLLL yyyy', { locale: pl });
const monthYearGenitive = (iso: string) => format(parseISO(iso), 'MMMM yyyy', { locale: pl });

export function ticketContent(
  item: PlanItem,
  booking: BookingType,
  summary: WaitTimeSummary | undefined,
  today: string,
): TicketContent {
  const weeks = booking === 'queue' ? queueWaitWeeks(summary) : null;
  // "Termin minął" only for a deadline we know was missed; due-from-today (never done, unknown
  // history) is "do it now", not "too late".
  const pastDue = item.overdue;
  const dueNow = pastDue || item.dueDate <= today;
  const date = monthYearGenitive(item.dueDate);

  let message: Message;
  if (item.urgency === 'this_year') {
    message = { key: 'plan.ticket.startFrom', params: { date: fullDate(item.notifyDate) } };
  } else if (booking === 'queue') {
    message = dueNow
      ? { key: 'plan.ticket.startToday' }
      : { key: 'plan.ticket.startTodayToMake', params: { date } };
  } else {
    message = dueNow
      ? { key: 'plan.ticket.dueNow' }
      : { key: 'plan.ticket.dueBy', params: { date } };
  }

  if (weeks !== null) {
    const unit: Message = { key: `plan.ticket.weeks.${pluralForm(weeks)}` };
    return {
      value: String(weeks),
      unit,
      message,
      a11yValue: { key: `plan.ticket.weeksA11y.${pluralForm(weeks)}`, params: { weeks } },
    };
  }
  // No queue data (program / walk-in / missing NFZ): print the due month instead of a made-up wait.
  return {
    value: monthYear(item.dueDate),
    unit: { key: pastDue ? 'plan.ticket.overdueUnit' : 'plan.ticket.dueUnit' },
    message,
    a11yValue: {
      key: pastDue ? 'plan.ticket.overdueA11y' : 'plan.ticket.dueA11y',
      params: { date: monthYearWords(item.dueDate) },
    },
  };
}

/**
 * Right-hand column of a list row, in mono: booked → "17.10", act now / this year → "12.2026",
 * later/done → year. Months always carry the year: a bare "12" (or a roman "XII") isn't read as a
 * month.
 */
export function rowDate(item: PlanItem, today: string): string {
  const sameYear = item.dueDate.slice(0, 4) === today.slice(0, 4);
  switch (item.urgency) {
    case 'booked':
      return format(parseISO(item.dueDate), sameYear ? 'dd.MM' : 'dd.MM.yy');
    case 'act_now':
    case 'this_year':
      return monthYear(item.dueDate);
    default:
      return item.dueDate.slice(0, 4);
  }
}
