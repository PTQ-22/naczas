import { addDays, addMonths, format, parseISO, subDays } from 'date-fns';

import type { ISODate, Plan, PlanItem, Profile, Urgency } from '@naczas/shared';

/**
 * Mock data for WS3/WS4 until computePlan() lands (WS1-6).
 * Intervals and lead times below are placeholders shaped like docs/05-scheduling-algorithm.md —
 * NOT verified medical values. Do not copy them into data/exams.json.
 */

export const MOCK_TODAY: ISODate = '2026-10-03';

export const mockProfileMama: Profile = {
  id: 'mock-mama',
  name: 'Mama',
  relation: 'parent',
  birthYear: 1968,
  sex: 'female',
  location: { province: '07', lat: 52.23, lng: 21.01, label: 'Warszawa' },
  conditions: [],
  familyHistory: ['colorectal_cancer'],
  smoking: { status: 'never' },
  activity: 'low',
  createdAt: MOCK_TODAY,
};

const URGENCY_ORDER: Record<Urgency, number> = {
  act_now: 0,
  booked: 1,
  this_year: 2,
  later: 3,
  done: 4,
};

const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');

export function mockPlan(options: { today?: ISODate; profileId?: string } = {}): Plan {
  const todayStr = options.today ?? MOCK_TODAY;
  const profileId = options.profileId ?? mockProfileMama.id;
  const today = parseISO(todayStr);

  const item = (
    fields: Omit<PlanItem, 'profileId' | 'notifyDate' | 'dueDate'> & { due: Date },
  ): PlanItem => {
    const { due, ...rest } = fields;
    return {
      ...rest,
      profileId,
      dueDate: toISO(due),
      notifyDate: toISO(subDays(due, fields.leadTimeDays)),
    };
  };

  const bookedFor = addDays(today, 12);

  const items: PlanItem[] = [
    // 'unknown' last date → dueDate = today; queue with snapshot p75 = 84 + 14 referral buffer.
    item({
      examId: 'colonoscopy_screening',
      due: today,
      leadTimeDays: 98,
      leadTimeSource: 'nfz_snapshot',
      urgency: 'act_now',
      reasons: [
        'Badanie przesiewowe zalecane w Twoim wieku.',
        'Ze względu na historię rodzinną (rak jelita grubego) warto nie odkładać tego badania.',
      ],
      overdue: false,
    }),
    // Booked: notifyDate = bookedFor − 1 (day-before reminder), per §1/§4.
    item({
      examId: 'mammography',
      due: bookedFor,
      leadTimeDays: 1,
      leadTimeSource: 'default',
      urgency: 'booked',
      reasons: ['Badanie w ramach programu profilaktycznego dla kobiet w Twoim wieku.'],
      overdue: false,
    }),
    // Queue without NFZ data → DEFAULT_QUEUE_DAYS = 60; notifyDate lands ~2 weeks from today.
    item({
      examId: 'eye_exam',
      due: addDays(today, 75),
      leadTimeDays: 60,
      leadTimeSource: 'default',
      urgency: 'this_year',
      reasons: ['Po 40. roku życia zalecana jest regularna kontrola wzroku.'],
      overdue: false,
    }),
    // 'within_1y' → assumed done today − 6 mo.; program lead time = 21 days.
    item({
      examId: 'cervical_screening',
      due: addMonths(today, 30),
      leadTimeDays: 21,
      leadTimeSource: 'default',
      urgency: 'later',
      reasons: ['Badanie w ramach programu profilaktycznego dla kobiet w Twoim wieku.'],
      overdue: false,
    }),
    // Done 2 months ago → next due > today + 365 → 'done'.
    item({
      examId: 'health_check_adult',
      due: addMonths(subDays(today, 60), 36),
      leadTimeDays: 21,
      leadTimeSource: 'default',
      urgency: 'done',
      reasons: ['Ogólny bilans zdrowia dla dorosłych.'],
      overdue: false,
    }),
  ];

  items.sort(
    (a, b) =>
      URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
      a.notifyDate.localeCompare(b.notifyDate),
  );

  return { profileId, generatedAt: todayStr, items };
}
