import { format, parseISO } from 'date-fns';

import { URGENCY_ORDER } from '@naczas/rules';
import type { BookingType, PlanItem, Urgency, WaitTimeSummary } from '@naczas/shared';

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
 * Weeks shown as "czeka się ~N tyg.": the NFZ median wait when we have it; otherwise the
 * engine's lead time (p75 + buffers, or the default), which overstates the wait a little.
 */
export function displayWaitWeeks(item: PlanItem, summary?: WaitTimeSummary): number {
  return waitWeeks(summary?.p50Days ?? item.leadTimeDays);
}

export interface Message {
  key: MessageKey;
  params?: TranslateParams;
}

/** Polish plural for "N badań wymaga działania" (1 / 2–4 / 5+, with 12–14 as "many"). */
export function summaryMessage(actNowCount: number): Message {
  const n = actNowCount;
  if (n === 0) return { key: 'plan.summary.none' };
  if (n === 1) return { key: 'plan.summary.one' };
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  const few = lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
  return { key: few ? 'plan.summary.few' : 'plan.summary.many', params: { count: n } };
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
    return { key: 'plan.card.whyNowQueue', params: { weeks: displayWaitWeeks(item, summary) } };
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
    case 'queue':
      return {
        action: 'facilities',
        variant,
        label: { key: 'plan.cta.findSlot', params: { weeks: displayWaitWeeks(item, summary) } },
      };
    case 'program':
      return { action: 'exam', variant, label: { key: 'plan.cta.program' } };
    case 'walk_in':
      return { action: 'markDone', variant, label: { key: 'plan.cta.walkIn' } };
  }
}

export function countActNow(items: readonly PlanItem[]): number {
  return items.filter((i) => i.urgency === 'act_now').length;
}
