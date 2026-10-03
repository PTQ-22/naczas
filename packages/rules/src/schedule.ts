import { addDays, addMonths, endOfYear, format, parseISO, subDays, subMonths } from 'date-fns';

import type {
  ExamRecord,
  ExamRule,
  ISODate,
  LastDoneAnswer,
  PlanItem,
  Profile,
  Urgency,
  WaitTimeSummary,
} from '@naczas/shared';

import { ageAt } from './age';
import { matchingModifiers } from './eligibility';

// All tunables of docs/05-scheduling-algorithm.md live here, so the algorithm can be explained
// (and changed) from one place.
export const DEFAULT_QUEUE_DAYS = 60;
export const PROGRAM_LEAD_DAYS = 21;
export const WALK_IN_LEAD_DAYS = 3;
export const REFERRAL_BUFFER_DAYS = 14;
export const LEAD_TIME_MIN_DAYS = 3;
export const LEAD_TIME_MAX_DAYS = 270;
/**
 * Survey buckets → assumed date: the middle of the bucket, as a fraction of the interval.
 * 'within_half_interval' = 0–½ interval ago → ¼; 'within_interval' = ½–1 interval ago → ¾.
 */
export const WITHIN_HALF_ASSUMED_FRACTION = 0.25;
export const WITHIN_INTERVAL_ASSUMED_FRACTION = 0.75;
/** status 'done' moves to the "Zrobione" section only if the next due date is further than this. */
export const DONE_HORIZON_DAYS = 365;
/** Booked exams: remind the day before the visit. */
export const BOOKED_REMINDER_DAYS = 1;

const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');

/** Rule interval, overridden by the most restrictive matching modifier (§1). */
export function effectiveIntervalMonths(
  rule: ExamRule,
  profile: Profile,
  today: ISODate,
  overrideMonths?: number,
): number {
  if (overrideMonths !== undefined) return overrideMonths;

  const age = ageAt(profile.birthYear, today);
  const overrides = matchingModifiers(rule, profile)
    .filter((m) => !m.age || (age >= m.age[0] && age <= m.age[1]))
    .flatMap((m) => (m.intervalMonths === undefined ? [] : [m.intervalMonths]));
  return Math.min(rule.intervalMonths, ...overrides);
}

/** §2: how many days ahead the user must start arranging the exam. */
export function leadTime(
  rule: Pick<ExamRule, 'booking' | 'referral'>,
  waitTime?: WaitTimeSummary,
): { days: number; source: PlanItem['leadTimeSource'] } {
  let base: number;
  let source: PlanItem['leadTimeSource'] = 'default';
  if (rule.booking === 'queue') {
    if (waitTime?.p75Days != null) {
      base = waitTime.p75Days;
      source = waitTime.source;
    } else {
      base = DEFAULT_QUEUE_DAYS;
    }
  } else {
    base = rule.booking === 'program' ? PROGRAM_LEAD_DAYS : WALK_IN_LEAD_DAYS;
  }
  const raw = base + (rule.referral ? REFERRAL_BUFFER_DAYS : 0);
  return { days: Math.min(LEAD_TIME_MAX_DAYS, Math.max(LEAD_TIME_MIN_DAYS, raw)), source };
}

/**
 * §1: survey answer → what the record stores. Dated buckets become a date anchored to the
 * answer day, so the due date stays put as time passes (a bucket re-read against a later
 * `today` would keep sliding forward and never come due).
 */
export function assumedLastDone(
  answer: LastDoneAnswer,
  intervalMonths: number,
  today: ISODate,
): NonNullable<ExamRecord['lastDone']> {
  const ago = (fraction: number) =>
    toISO(subMonths(parseISO(today), Math.round(intervalMonths * fraction)));
  switch (answer) {
    case 'within_half_interval':
      return ago(WITHIN_HALF_ASSUMED_FRACTION);
    case 'within_interval':
      return ago(WITHIN_INTERVAL_ASSUMED_FRACTION);
    default:
      return answer;
  }
}

/** §1: when the exam should be done, from the record's last-done date or undated answer. */
export function dueDate(
  lastDone: ExamRecord['lastDone'],
  intervalMonths: number,
  today: ISODate,
): { dueDate: ISODate; overdue: boolean } {
  switch (lastDone) {
    case undefined:
    case 'never':
    case 'unknown':
      return { dueDate: today, overdue: false };
    case 'over_interval':
      return { dueDate: today, overdue: true };
  }
  const due = toISO(addMonths(parseISO(lastDone), intervalMonths));
  return { dueDate: due, overdue: due < today };
}

/** §4. ISO strings compare correctly as plain strings. */
export function urgencyFor(input: {
  status: ExamRecord['status'];
  dueDate: ISODate;
  notifyDate: ISODate;
  today: ISODate;
}): Urgency {
  const { status, dueDate: due, notifyDate, today } = input;
  if (status === 'booked') return 'booked';
  const now = parseISO(today);
  if (status === 'done' && due > toISO(addDays(now, DONE_HORIZON_DAYS))) return 'done';
  if (notifyDate <= today) return 'act_now';
  if (notifyDate <= toISO(endOfYear(now))) return 'this_year';
  return 'later';
}

/** Dates and urgency for one exam; reasons are filled in by computePlan. */
export function scheduleExam(input: {
  rule: ExamRule;
  profile: Profile;
  record?: ExamRecord;
  intervalOverride?: number;
  waitTime?: WaitTimeSummary;
  today: ISODate;
}): Omit<PlanItem, 'reasons'> {
  const { rule, profile, record, intervalOverride, waitTime, today } = input;
  const base = { examId: rule.id, profileId: profile.id };

  if (record?.status === 'booked') {
    // Booked without a date can't be scheduled precisely; treat the visit as due today.
    const visit = record.bookedFor ?? today;
    return {
      ...base,
      dueDate: visit,
      notifyDate: toISO(subDays(parseISO(visit), BOOKED_REMINDER_DAYS)),
      leadTimeDays: BOOKED_REMINDER_DAYS,
      leadTimeSource: 'default',
      urgency: 'booked',
      overdue: false,
    };
  }

  const interval = effectiveIntervalMonths(rule, profile, today, intervalOverride);
  const due = dueDate(record?.lastDone, interval, today);
  const lead = leadTime(rule, waitTime);
  const notifyDate = toISO(subDays(parseISO(due.dueDate), lead.days));
  return {
    ...base,
    dueDate: due.dueDate,
    notifyDate,
    leadTimeDays: lead.days,
    leadTimeSource: lead.source,
    urgency: urgencyFor({
      status: record?.status ?? 'none',
      dueDate: due.dueDate,
      notifyDate,
      today,
    }),
    overdue: due.overdue,
  };
}
