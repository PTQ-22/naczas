import type {
  ExamRecord,
  ExamRule,
  ISODate,
  Plan,
  PlanItem,
  Profile,
  Urgency,
  WaitTimeSummary,
} from '@naczas/shared';

import { ageAt } from './age';
import { eligibleExams, matchingModifiers } from './eligibility';
import { scheduleExam } from './schedule';

export const URGENCY_ORDER: Record<Urgency, number> = {
  act_now: 0,
  booked: 1,
  this_year: 2,
  later: 3,
  done: 4,
};

/**
 * Urgency first. Among act_now, the longest lead time (longest NFZ queue) comes first: it is the
 * one that gets worse with every day of waiting. Then notifyDate.
 */
export function comparePlanItems(a: PlanItem, b: PlanItem): number {
  return (
    URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
    (a.urgency === 'act_now' ? b.leadTimeDays - a.leadTimeDays : 0) ||
    a.notifyDate.localeCompare(b.notifyDate)
  );
}

/** Base reason + notes of modifiers that apply to this profile at its current age. */
export function reasonsFor(rule: ExamRule, profile: Profile, today: ISODate): string[] {
  const age = ageAt(profile.birthYear, today);
  const notes = matchingModifiers(rule, profile)
    .filter((m) => !m.age || (age >= m.age[0] && age <= m.age[1]))
    .map((m) => m.note);
  return [rule.shortReason, ...notes];
}

export function computePlan(input: {
  profile: Profile;
  records: ExamRecord[];
  intervalOverrides?: Record<string, number>;
  waitTimes: Record<string, WaitTimeSummary | undefined>;
  today: ISODate;
}): Plan {
  const { profile, records, intervalOverrides = {}, waitTimes, today } = input;
  const items = eligibleExams(profile, today).map((rule): PlanItem => ({
    ...scheduleExam({
      rule,
      profile,
      record: records.find((r) => r.profileId === profile.id && r.examId === rule.id),
      intervalOverride: intervalOverrides[`${profile.id}|${rule.id}`],
      waitTime: waitTimes[rule.id],
      today,
    }),
    reasons: reasonsFor(rule, profile, today),
  }));
  return { profileId: profile.id, generatedAt: today, items: items.sort(comparePlanItems) };
}
