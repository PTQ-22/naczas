import { format, parseISO } from 'date-fns';

import type { ExamRule, PlanItem, WaitTimeSummary } from '@naczas/shared';

import { queueRange, type QueueRange } from '@/features/plan/plan-view-model';
import type { MessageKey, TranslateParams } from '@/i18n';

export interface Message {
  key: MessageKey;
  params?: TranslateParams;
}

const fullDate = (iso: string) => format(parseISO(iso), 'dd.MM.yyyy');
const monthYear = (iso: string) => format(parseISO(iso), 'MM.yyyy');

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
    default: {
      const due: Message = { key: 'exam.dueBy', params: { date: monthYear(item.dueDate) } };
      // "Start now" would repeat the "Teraz" status above; only a future start date adds info.
      return item.notifyDate <= today
        ? [due]
        : [due, { key: 'exam.startFrom', params: { date: fullDate(item.notifyDate) } }];
    }
  }
}

export type ExamStep = 'toBook' | 'booked' | 'done';
export const EXAM_STEPS: readonly ExamStep[] = ['toBook', 'booked', 'done'];

/**
 * Where the exam is in "do umówienia → umówione → zrobione" — the progress strip on the exam
 * screen. null while it isn't time to act yet (this year / later): no progress to show.
 */
export function examStep(item: PlanItem | undefined): ExamStep | null {
  switch (item?.urgency) {
    case 'act_now':
      return 'toBook';
    case 'booked':
      return 'booked';
    case 'done':
      return 'done';
    default:
      return null;
  }
}

export interface QueueInfo {
  /** true → render on the urgency bg; false → neutral surfaceAlt "no data" box. */
  hasData: boolean;
  /** Fastest–p75 wait in weeks — printed big by QueueNumber; undefined without NFZ data. */
  range?: QueueRange;
  lines: { label?: Message; meta?: Message };
}

/**
 * Queue box — our differentiator, so it is shown whenever the exam is booked via the NFZ queue.
 * Shows the NFZ p75 wait when we have a summary; otherwise a "start early" note without a number.
 */
export function queueInfo(rule: ExamRule, summary: WaitTimeSummary | undefined): QueueInfo | null {
  if (rule.booking !== 'queue') return null;
  const range = queueRange(summary);
  if (summary && range) {
    return {
      hasData: true,
      range,
      lines: {
        label: { key: 'exam.queue.radius', params: { km: summary.radiusKm } },
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
