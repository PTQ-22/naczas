import { MOCK_TODAY, mockPlan } from '@naczas/rules';
import type { ExamRecord, PlanItem, WaitTimeSummary } from '@naczas/shared';

import {
  countActNow,
  dateMessage,
  queueWaitWeeks,
  groupSections,
  hasUnknownHistory,
  isCollapsedByDefault,
  planCta,
  planLayout,
  pluralForm,
  queueRange,
  rowDate,
  summaryMessage,
  ticketContent,
  ticketItem,
  waitWeeks,
  whyNowMessage,
} from '../plan-view-model';

const plan = mockPlan({ today: MOCK_TODAY });
const byUrgency = (u: PlanItem['urgency']): PlanItem => {
  const item = plan.items.find((i) => i.urgency === u);
  if (!item) throw new Error(`mock has no ${u} item`);
  return item;
};

describe('groupSections', () => {
  it('orders sections act_now → booked → this_year → later → done', () => {
    expect(groupSections(plan.items).map((s) => s.urgency)).toEqual([
      'act_now',
      'booked',
      'this_year',
      'later',
      'done',
    ]);
  });

  it('drops empty sections', () => {
    expect(groupSections([byUrgency('done')]).map((s) => s.urgency)).toEqual(['done']);
    expect(groupSections([])).toEqual([]);
  });
});

describe('isCollapsedByDefault', () => {
  it('collapses done always and later only in senior mode', () => {
    expect(isCollapsedByDefault('done', false)).toBe(true);
    expect(isCollapsedByDefault('later', false)).toBe(false);
    expect(isCollapsedByDefault('later', true)).toBe(true);
    expect(isCollapsedByDefault('act_now', true)).toBe(false);
  });
});

describe('summaryMessage (Polish plural)', () => {
  it.each([
    [0, 'plan.summary.none'],
    [1, 'plan.summary.one'],
    [2, 'plan.summary.few'],
    [4, 'plan.summary.few'],
    [5, 'plan.summary.many'],
    [12, 'plan.summary.many'],
    [22, 'plan.summary.few'],
  ] as const)('%i → %s', (n, key) => {
    expect(summaryMessage(n).key).toBe(key);
  });
});

const nfz = (p75Days: number | null): WaitTimeSummary => ({
  examId: 'colonoscopy_screening',
  province: '07',
  radiusKm: 25,
  facilitiesCount: 5,
  p50Days: 140,
  p75Days,
  minDays: 10,
  asOf: '2026-09',
  source: 'nfz_snapshot',
});

describe('queueWaitWeeks', () => {
  it('uses only the NFZ p75 wait, never the lead time', () => {
    expect(queueWaitWeeks(nfz(213))).toBe(30);
    expect(queueWaitWeeks(nfz(null))).toBeNull();
    expect(queueWaitWeeks(undefined)).toBeNull();
  });
});

describe('queueRange', () => {
  it('spans the fastest nearby facility to the p75 wait — the facility list opens on the fastest', () => {
    expect(queueRange(nfz(213))).toEqual({ min: 1, max: 30, text: '1–30' });
    expect(queueRange({ ...nfz(213), minDays: 21 })).toEqual({ min: 3, max: 30, text: '3–30' });
  });

  it('collapses to one number without a minimum or when both ends round the same', () => {
    expect(queueRange({ ...nfz(213), minDays: null })).toEqual({ min: null, max: 30, text: '30' });
    expect(queueRange({ ...nfz(210), minDays: 208 })?.text).toBe('30');
    expect(queueRange(nfz(null))).toBeNull();
  });
});

describe('waitWeeks', () => {
  it('rounds days to weeks, never below 1', () => {
    expect(waitWeeks(98)).toBe(14);
    expect(waitWeeks(3)).toBe(1);
  });
});

describe('dateMessage', () => {
  it('uses month/year for due items and full date for booked', () => {
    expect(dateMessage(byUrgency('act_now'))).toEqual({
      key: 'plan.card.dueBy',
      params: { date: '10.2026' },
    });
    expect(dateMessage(byUrgency('booked'))).toEqual({
      key: 'plan.card.bookedFor',
      params: { date: '15.10.2026' },
    });
    expect(dateMessage(byUrgency('later')).key).toBe('plan.card.nextAround');
  });
});

describe('whyNowMessage', () => {
  it('explains the queue for act_now / this_year queue exams only', () => {
    expect(whyNowMessage(byUrgency('act_now'), 'queue', nfz(213))).toEqual({
      key: 'plan.card.whyNowQueue',
      params: { weeks: '1–30' },
    });
    expect(whyNowMessage(byUrgency('act_now'), 'queue')?.key).toBe('plan.card.startEarly');
    expect(whyNowMessage(byUrgency('this_year'), 'queue')?.key).toBe('plan.card.startFrom');
    expect(whyNowMessage(byUrgency('act_now'), 'program')).toBeNull();
    expect(whyNowMessage(byUrgency('later'), 'queue')).toBeNull();
  });
});

describe('planCta', () => {
  const actNow = byUrgency('act_now');

  it('maps booking type to a single CTA', () => {
    expect(planCta(actNow, 'queue', true, nfz(213))).toMatchObject({
      action: 'facilities',
      variant: 'primary',
      label: { key: 'plan.cta.findSlot', params: { weeks: 30 } },
    });
    expect(planCta(actNow, 'queue', true)?.label).toEqual({ key: 'plan.cta.findSlotPlain' });
    expect(planCta(actNow, 'program', false)).toMatchObject({
      action: 'exam',
      variant: 'secondary',
    });
    expect(planCta(actNow, 'walk_in', false)?.label.key).toBe('plan.cta.walkIn');
  });

  it('booked → mark done; later and done → no CTA', () => {
    expect(planCta(byUrgency('booked'), 'program', false)?.action).toBe('markDone');
    expect(planCta(byUrgency('later'), 'queue', false)).toBeNull();
    expect(planCta(byUrgency('done'), 'queue', false)).toBeNull();
  });
});

describe('countActNow', () => {
  it('counts urgent items for the profile badge', () => {
    expect(countActNow(plan.items)).toBe(1);
  });
});

describe('pluralForm', () => {
  it.each([
    [1, 'one'],
    [2, 'few'],
    [4, 'few'],
    [5, 'many'],
    [12, 'many'],
    [14, 'many'],
    [22, 'few'],
    [29, 'many'],
  ] as const)('%i -> %s', (n, form) => {
    expect(pluralForm(n)).toBe(form);
  });
});

describe('ticketItem', () => {
  it('picks the first act_now item', () => {
    expect(ticketItem(plan.items)?.urgency).toBe('act_now');
  });

  it('prefers the act_now item with the longest queue — that is where starting early matters', () => {
    const a: PlanItem = { ...byUrgency('act_now'), examId: 'a' };
    const b: PlanItem = { ...byUrgency('act_now'), examId: 'b' };
    const weeks = (id: string) => (id === 'b' ? 29 : null);
    expect(ticketItem([a, b], weeks)?.examId).toBe('b');
    expect(ticketItem([a, b], () => null)?.examId).toBe('a');
  });

  it('falls back to this_year when nothing is urgent, and to nothing at all', () => {
    const calm = plan.items.filter((i) => i.urgency !== 'act_now');
    expect(ticketItem(calm)?.urgency).toBe('this_year');
    expect(ticketItem(calm.filter((i) => i.urgency !== 'this_year'))).toBeUndefined();
  });
});

describe('hasUnknownHistory', () => {
  const rec = (patch: Partial<ExamRecord>): ExamRecord => ({
    profileId: 'p',
    examId: 'x',
    status: 'none',
    updatedAt: '2026-10-01',
    ...patch,
  });

  it('is true without a record or with an unanswered / "unknown" last date', () => {
    expect(hasUnknownHistory(undefined)).toBe(true);
    expect(hasUnknownHistory(rec({}))).toBe(true);
    expect(hasUnknownHistory(rec({ lastDone: 'unknown' }))).toBe(true);
  });

  it('is false once we know anything: a date, a bucket, "never", a booking', () => {
    expect(hasUnknownHistory(rec({ lastDone: '2024-05-01' }))).toBe(false);
    expect(hasUnknownHistory(rec({ lastDone: 'never' }))).toBe(false);
    expect(hasUnknownHistory(rec({ lastDone: 'over_interval' }))).toBe(false);
    expect(hasUnknownHistory(rec({ status: 'booked', bookedFor: '2026-11-01' }))).toBe(false);
  });
});

describe('planLayout', () => {
  const act = (examId: string): PlanItem => ({ ...byUrgency('act_now'), examId });
  const items = [act('known'), act('unknown1'), act('unknown2'), byUrgency('this_year')];
  const layout = planLayout(items, new Set(['unknown1', 'unknown2']));

  it('moves act_now exams with unknown history out of the urgent group', () => {
    expect(layout.unknown.map((i) => i.examId)).toEqual(['unknown1', 'unknown2']);
    expect(layout.hero?.examId).toBe('known');
    expect(layout.sections.flatMap((s) => s.items).map((i) => i.examId)).not.toContain('unknown1');
  });

  it('counts only known act_now exams as urgent (badge, summary)', () => {
    expect(layout.actNowCount).toBe(1);
  });

  it('with no known urgent exam, the unknown one with the longest queue still gets the ticket', () => {
    // Pitch flow: Mama answers "nie pamiętam" everywhere → colonoscopy still leads the plan.
    const weeks = (id: string) => (id === 'long' ? 29 : 5);
    const allUnknown = planLayout([act('short'), act('long')], new Set(['short', 'long']), weeks);
    expect(allUnknown.hero?.examId).toBe('long');
    expect(allUnknown.unknown.map((i) => i.examId)).toEqual(['short']);
    expect(allUnknown.actNowCount).toBe(1);
  });
});

describe('ticketContent', () => {
  const summary = (p75Days: number | null): WaitTimeSummary => ({
    examId: 'x',
    province: '07',
    radiusKm: 25,
    facilitiesCount: 3,
    p50Days: p75Days,
    p75Days,
    minDays: 7,
    asOf: '2026-09',
    source: 'nfz_snapshot',
  });
  const future: PlanItem = { ...byUrgency('act_now'), dueDate: '2027-04-15', overdue: false };

  it('prints the NFZ queue range with the Polish plural and a deadline sentence', () => {
    const c = ticketContent(future, 'queue', summary(203), '2026-10-03');
    expect(c.value).toBe('1–29');
    expect(c.unit).toEqual({ key: 'plan.ticket.weeks.many' });
    expect(c.message).toEqual({
      key: 'plan.ticket.startTodayToMake',
      params: { date: 'kwietnia 2027' },
    });
    expect(c.a11yValue).toEqual({ key: 'plan.ticket.rangeA11y', params: { min: 1, max: 29 } });
    const single = ticketContent(future, 'queue', { ...summary(203), minDays: null }, '2026-10-03');
    expect(single.value).toBe('29');
    expect(single.a11yValue).toEqual({
      key: 'plan.ticket.weeksA11y.many',
      params: { weeks: 29 },
    });
  });

  it('drops the deadline once it has passed', () => {
    const late = { ...future, dueDate: '2026-09-01', overdue: true };
    expect(ticketContent(late, 'queue', summary(203), '2026-10-03').message).toEqual({
      key: 'plan.ticket.startToday',
    });
  });

  it('does not call an exam overdue just because it is due from today (unknown history)', () => {
    const fromToday = { ...future, dueDate: '2026-10-03', overdue: false };
    const c = ticketContent(fromToday, 'program', undefined, '2026-10-03');
    expect(c.unit).toEqual({ key: 'plan.ticket.dueUnit' });
    expect(c.message).toEqual({ key: 'plan.ticket.dueNow' });
  });

  it('prints the due month instead of a made-up wait when there is no queue data', () => {
    const c = ticketContent(future, 'program', undefined, '2026-10-03');
    expect(c.value).toBe('04.2027');
    expect(c.unit).toEqual({ key: 'plan.ticket.dueUnit' });
    expect(ticketContent(future, 'queue', summary(null), '2026-10-03').value).toBe('04.2027');
  });
});

describe('rowDate', () => {
  const at = (urgency: PlanItem['urgency'], dueDate: string): PlanItem => ({
    ...byUrgency('act_now'),
    urgency,
    dueDate,
  });

  it('booked: day.month, with year only when not this year', () => {
    expect(rowDate(at('booked', '2026-10-17'), '2026-10-03')).toBe('17.10');
    expect(rowDate(at('booked', '2027-01-05'), '2026-10-03')).toBe('05.01.27');
  });

  it('act now / this year: numeric month with the year', () => {
    expect(rowDate(at('this_year', '2026-12-01'), '2026-10-03')).toBe('12.2026');
    expect(rowDate(at('this_year', '2027-04-01'), '2026-10-03')).toBe('04.2027');
    expect(rowDate(at('act_now', '2026-10-01'), '2026-10-03')).toBe('10.2026');
  });

  it('later / done: year only', () => {
    expect(rowDate(at('later', '2031-06-01'), '2026-10-03')).toBe('2031');
  });
});
