import { format, parseISO } from 'date-fns';

import type { ExamRule, PlanItem, WaitTimeSummary } from '@naczas/shared';

import type { MessageKey, TranslateParams } from '@/i18n';

export interface Message {
  key: MessageKey;
  params?: TranslateParams;
}

const fullDate = (iso: string) => format(parseISO(iso), 'dd.MM.yyyy');
const monthYear = (iso: string) => format(parseISO(iso), 'MM.yyyy');
const weeks = (days: number) => Math.max(1, Math.round(days / 7));

/** "Co 10 lat" / "Co 2 lata" / "Co rok" / "Co 6 miesięcy" — Polish plural for years. */
export function frequencyMessage(intervalMonths: number): Message {
  if (intervalMonths < 12 || intervalMonths % 12 !== 0) {
    return { key: 'exam.frequency.months', params: { count: intervalMonths } };
  }
  const years = intervalMonths / 12;
  if (years === 1) return { key: 'exam.frequency.oneYear' };
  const lastDigit = years % 10;
  const lastTwo = years % 100;
  const few = lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
  return {
    key: few ? 'exam.frequency.years' : 'exam.frequency.yearsMany',
    params: { count: years },
  };
}

/** referralNote (WS1 copy) wins; otherwise a generic line from the `referral` flag. */
export function referralText(rule: ExamRule): string | Message {
  if (rule.referralNote) return rule.referralNote;
  return { key: rule.referral ? 'exam.referral.required' : 'exam.referral.notRequired' };
}

/** Lines under the title: when to do it and when to start looking. */
export function timingMessages(item: PlanItem, today: string): Message[] {
  switch (item.urgency) {
    case 'booked':
      return [{ key: 'exam.bookedFor', params: { date: fullDate(item.dueDate) } }];
    case 'done':
    case 'later':
      return [{ key: 'exam.doneNext', params: { date: monthYear(item.dueDate) } }];
    default:
      return [
        { key: 'exam.dueBy', params: { date: monthYear(item.dueDate) } },
        item.notifyDate <= today
          ? { key: 'exam.startNow' }
          : { key: 'exam.startFrom', params: { date: fullDate(item.notifyDate) } },
      ];
  }
}

export interface QueueInfo {
  /** true → render on the urgency bg; false → neutral surfaceAlt "no data" box. */
  hasData: boolean;
  /** p75 wait in weeks — printed big by QueueNumber; undefined without NFZ data. */
  weeks?: number;
  lines: { label?: Message; value?: Message; meta?: Message };
}

/**
 * Queue box — our differentiator, so it is shown whenever the exam is booked via the NFZ queue.
 * Shows the NFZ p75 wait when we have a summary; otherwise a "start early" note without a number.
 */
export function queueInfo(rule: ExamRule, summary: WaitTimeSummary | undefined): QueueInfo | null {
  if (rule.booking !== 'queue') return null;
  if (summary?.p75Days != null) {
    return {
      hasData: true,
      weeks: weeks(summary.p75Days),
      lines: {
        label: { key: 'exam.queue.radius', params: { km: summary.radiusKm } },
        value: { key: 'exam.queue.weeks', params: { weeks: weeks(summary.p75Days) } },
        meta: { key: 'exam.queue.asOf', params: { date: summary.asOf } },
      },
    };
  }
  // No NFZ summary: leadTimeDays is "when to start", not a wait — don't present it as one.
  return { hasData: false, lines: { label: { key: 'exam.queue.noData' } } };
}

export type ExamAction = 'facilities' | 'program' | 'markDone' | 'book';

export interface ExamCta {
  action: ExamAction;
  label: Message;
}

/** Sticky footer: one primary + optional ghost, per screens.md §3 table. */
export function examCtas(
  rule: ExamRule,
  item: PlanItem | undefined,
): { primary?: ExamCta; ghost?: ExamCta } {
  const urgency = item?.urgency;
  if (urgency === 'done') {
    return { ghost: { action: 'book', label: { key: 'exam.cta.doneEarlier' } } };
  }
  if (urgency === 'booked') {
    return {
      primary: { action: 'markDone', label: { key: 'exam.cta.markDone' } },
      ghost: { action: 'book', label: { key: 'exam.cta.changeDate' } },
    };
  }
  switch (rule.booking) {
    case 'queue':
      return {
        primary: { action: 'facilities', label: { key: 'exam.cta.findSlot' } },
        ghost: { action: 'book', label: { key: 'exam.cta.booked' } },
      };
    case 'program':
      return {
        primary: { action: 'program', label: { key: 'exam.cta.program' } },
        ghost: { action: 'markDone', label: { key: 'exam.cta.done' } },
      };
    case 'walk_in':
      return { primary: { action: 'markDone', label: { key: 'exam.cta.markDone' } } };
  }
}
