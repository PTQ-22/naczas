import { addMonths, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ExamRecord, ExamRule, Profile, WaitTimeSummary } from '@naczas/shared';

import {
  DEFAULT_QUEUE_DAYS,
  LEAD_TIME_MAX_DAYS,
  LEAD_TIME_MIN_DAYS,
  assumedLastDone,
  dueDate,
  effectiveIntervalMonths,
  getExamRule,
  leadTime,
  scheduleExam,
  urgencyFor,
} from '../src';

const TODAY = '2026-10-03';
const iso = (d: Date) => format(d, 'yyyy-MM-dd');

const profile: Profile = {
  id: 'p',
  name: 'Test',
  relation: 'self',
  birthYear: 1968,
  sex: 'female',
  conditions: [],
  familyHistory: [],
  smoking: { status: 'never' },
  createdAt: TODAY,
};

const record = (r: Partial<ExamRecord>): ExamRecord => ({
  profileId: 'p',
  examId: 'x',
  status: 'none',
  updatedAt: TODAY,
  ...r,
});

const wait = (p75Days: number | null): WaitTimeSummary => ({
  examId: 'x',
  province: '07',
  radiusKm: 15,
  facilitiesCount: 5,
  p50Days: p75Days,
  p75Days,
  minDays: p75Days,
  asOf: '2026-09',
  source: 'nfz_live',
});

const queueRule = (referral: boolean) => ({ booking: 'queue' as const, referral });

describe('§5 required cases', () => {
  it('no history → dueDate = today, act_now', () => {
    const item = scheduleExam({ rule: getExamRule('mammography'), profile, today: TODAY });
    expect(item.dueDate).toBe(TODAY);
    expect(item.urgency).toBe('act_now');
    expect(item.overdue).toBe(false);
  });

  // §5 says "later" while §4 says status 'done' + due > today + 365 → 'done'. Both hold if
  // §5 means a last-done date from the survey (status 'none'); status 'done' is tested below.
  it('done yesterday, 24-month interval → later, notifyDate = today + 24 mo − leadTime', () => {
    const yesterday = iso(subDays(parseISO(TODAY), 1));
    const item = scheduleExam({
      rule: getExamRule('mammography'),
      profile,
      record: record({ lastDone: yesterday }),
      today: TODAY,
    });
    expect(item.urgency).toBe('later');
    const expected = subDays(addMonths(parseISO(yesterday), 24), item.leadTimeDays);
    expect(item.notifyDate).toBe(iso(expected));
  });

  it('same, but marked done in the app → done (§4)', () => {
    const item = scheduleExam({
      rule: getExamRule('mammography'),
      profile,
      record: record({ lastDone: iso(subDays(parseISO(TODAY), 1)), status: 'done' }),
      today: TODAY,
    });
    expect(item.urgency).toBe('done');
  });

  it('queue with p75 = 70 + referral → leadTime 84', () => {
    expect(leadTime(queueRule(true), wait(70))).toEqual({ days: 84, source: 'nfz_live' });
  });

  it('queue without NFZ data → default 60, source default', () => {
    expect(leadTime(queueRule(false))).toEqual({ days: DEFAULT_QUEUE_DAYS, source: 'default' });
    expect(leadTime(queueRule(false), wait(null))).toEqual({
      days: DEFAULT_QUEUE_DAYS,
      source: 'default',
    });
  });

  it('booked → urgency booked, notifyDate = bookedFor − 1', () => {
    const item = scheduleExam({
      rule: getExamRule('mammography'),
      profile,
      record: record({ status: 'booked', bookedFor: '2026-11-20' }),
      today: TODAY,
    });
    expect(item).toMatchObject({
      urgency: 'booked',
      dueDate: '2026-11-20',
      notifyDate: '2026-11-19',
      overdue: false,
    });
  });

  it('clamp: p75 = 400 → leadTime 270', () => {
    expect(leadTime(queueRule(false), wait(400)).days).toBe(LEAD_TIME_MAX_DAYS);
    expect(leadTime(queueRule(true), wait(400)).days).toBe(LEAD_TIME_MAX_DAYS);
  });

  describe('fixed today — independent of the system clock', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('same input → same output whatever the system date', () => {
      const input = { rule: getExamRule('colonoscopy_screening'), profile, today: TODAY };
      const before = scheduleExam(input);
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2031-06-15T12:00:00Z'));
      expect(scheduleExam(input)).toEqual(before);
    });
  });
});

describe('leadTime', () => {
  it('program = 21, walk_in = 3, plus referral buffer', () => {
    expect(leadTime({ booking: 'program', referral: false }).days).toBe(21);
    expect(leadTime({ booking: 'walk_in', referral: false }).days).toBe(3);
    expect(leadTime({ booking: 'walk_in', referral: true }).days).toBe(17);
  });

  it('clamps up to the minimum', () => {
    expect(leadTime(queueRule(false), wait(0)).days).toBe(LEAD_TIME_MIN_DAYS);
  });

  it('carries the snapshot source through', () => {
    expect(leadTime(queueRule(false), { ...wait(30), source: 'nfz_snapshot' }).source).toBe(
      'nfz_snapshot',
    );
  });
});

describe('dueDate', () => {
  it.each([
    ['never', TODAY, false],
    ['unknown', TODAY, false],
    [undefined, TODAY, false],
    ['over_interval', TODAY, true],
  ] as const)('%s → %s, overdue %s', (lastDone, due, overdue) => {
    expect(dueDate(lastDone, 24, TODAY)).toEqual({ dueDate: due, overdue });
  });

  it('exact date + interval; overdue when in the past', () => {
    expect(dueDate('2020-01-15', 24, TODAY)).toEqual({ dueDate: '2022-01-15', overdue: true });
    expect(dueDate('2026-01-15', 12, TODAY)).toEqual({ dueDate: '2027-01-15', overdue: false });
  });
});

describe('assumedLastDone — survey buckets relative to the exam interval', () => {
  it('within half the interval → middle of that half (interval / 4 ago)', () => {
    expect(assumedLastDone('within_half_interval', 120, TODAY)).toBe('2024-04-03'); // 30 mo.
    expect(assumedLastDone('within_half_interval', 12, TODAY)).toBe('2026-07-03'); // 3 mo.
  });

  it('half to full interval ago → middle of that range (3/4 of the interval ago)', () => {
    expect(assumedLastDone('within_interval', 120, TODAY)).toBe('2019-04-03'); // 90 mo.
    expect(assumedLastDone('within_interval', 24, TODAY)).toBe('2025-04-03'); // 18 mo.
  });

  it('keeps answers without a date', () => {
    expect(assumedLastDone('over_interval', 24, TODAY)).toBe('over_interval');
    expect(assumedLastDone('never', 24, TODAY)).toBe('never');
    expect(assumedLastDone('unknown', 24, TODAY)).toBe('unknown');
  });

  it('colonoscopy done 5 years ago is not overdue (the bug this replaced)', () => {
    const last = assumedLastDone('within_half_interval', 120, TODAY);
    expect(dueDate(last, 120, TODAY).overdue).toBe(false);
  });

  it('every dated bucket is due within the interval, in order', () => {
    for (const interval of [12, 24, 36, 60, 120]) {
      const recent = dueDate(
        assumedLastDone('within_half_interval', interval, TODAY),
        interval,
        TODAY,
      );
      const older = dueDate(assumedLastDone('within_interval', interval, TODAY), interval, TODAY);
      expect(older.dueDate < recent.dueDate).toBe(true);
      expect(older.overdue).toBe(false);
      expect(recent.dueDate <= iso(addMonths(parseISO(TODAY), interval))).toBe(true);
    }
  });

  it('is anchored to the answer day: the due date does not move as time passes', () => {
    const last = assumedLastDone('within_half_interval', 12, '2026-01-10');
    expect(dueDate(last, 12, '2026-01-10').dueDate).toBe(dueDate(last, 12, TODAY).dueDate);
  });
});

describe('urgencyFor', () => {
  const at = (notifyDate: string, dueDate = '2030-01-01', status: ExamRecord['status'] = 'none') =>
    urgencyFor({ status, dueDate, notifyDate, today: TODAY });

  it('act_now when notifyDate ≤ today', () => {
    expect(at(TODAY)).toBe('act_now');
  });

  it('this_year when notifyDate ≤ 31 Dec', () => {
    expect(at('2026-12-31')).toBe('this_year');
  });

  it('later after the end of the year', () => {
    expect(at('2027-01-01')).toBe('later');
  });

  it('done only when status done and due > today + 365', () => {
    expect(at('2028-01-01', '2028-01-01', 'done')).toBe('done');
    expect(at('2027-09-01', '2027-10-03', 'done')).toBe('later'); // exactly today + 365
    expect(at(TODAY, TODAY, 'done')).toBe('act_now');
  });
});

describe('effectiveIntervalMonths', () => {
  const base = getExamRule('colonoscopy_screening');
  const withOverride: ExamRule = {
    ...base,
    modifiers: [
      { when: 'colorectal_cancer', intervalMonths: 60, note: 'a' },
      { when: 'colorectal_cancer', age: [40, 49], intervalMonths: 24, note: 'b' },
      { when: 'diabetes', intervalMonths: 12, note: 'c' },
    ],
  };
  const fam = { ...profile, familyHistory: ['colorectal_cancer' as const] };

  it('uses the most restrictive matching modifier within its age range', () => {
    expect(effectiveIntervalMonths(withOverride, fam, TODAY)).toBe(60); // 58 y.o.: 'b' out of range
    expect(effectiveIntervalMonths(withOverride, { ...fam, birthYear: 1981 }, TODAY)).toBe(24);
  });

  it('applies an age-only modifier (no `when`) by age alone', () => {
    const ageOnly: ExamRule = {
      ...base,
      modifiers: [{ age: [50, 120], intervalMonths: 36, note: 'x' }],
    };
    expect(effectiveIntervalMonths(ageOnly, profile, TODAY)).toBe(36); // 58 y.o.
    expect(effectiveIntervalMonths(ageOnly, { ...profile, birthYear: 1990 }, TODAY)).toBe(
      base.intervalMonths,
    );
  });

  it('falls back to the rule interval when nothing matches', () => {
    expect(effectiveIntervalMonths(withOverride, profile, TODAY)).toBe(base.intervalMonths);
  });
});

describe('scheduleExam', () => {
  it('notifyDate = dueDate − leadTimeDays', () => {
    const item = scheduleExam({
      rule: getExamRule('colonoscopy_screening'),
      profile,
      record: record({ lastDone: '2018-05-01' }),
      waitTime: wait(90),
      today: TODAY,
    });
    expect(differenceInCalendarDays(parseISO(item.dueDate), parseISO(item.notifyDate))).toBe(
      item.leadTimeDays,
    );
    expect(item.leadTimeDays).toBe(90);
    expect(item.leadTimeSource).toBe('nfz_live');
  });

  it('booked without bookedFor falls back to today', () => {
    const item = scheduleExam({
      rule: getExamRule('mammography'),
      profile,
      record: record({ status: 'booked' }),
      today: TODAY,
    });
    expect(item.dueDate).toBe(TODAY);
    expect(item.urgency).toBe('booked');
  });
});
