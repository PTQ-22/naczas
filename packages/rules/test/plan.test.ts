import { describe, expect, it } from 'vitest';

import {
  PlanSchema,
  type ExamRecord,
  type PlanItem,
  type Profile,
  type WaitTimeSummary,
} from '@naczas/shared';

import { URGENCY_ORDER, comparePlanItems, computePlan } from '../src';

const TODAY = '2026-10-03';

const mama: Profile = {
  id: 'mama',
  name: 'Mama',
  relation: 'parent',
  birthYear: 1968, // 58
  sex: 'female',
  location: { province: '07', lat: 52.23, lng: 21.01, label: 'Warszawa' },
  conditions: [],
  familyHistory: ['colorectal_cancer'],
  smoking: { status: 'never' },
  createdAt: TODAY,
};

const kasia: Profile = {
  ...mama,
  id: 'kasia',
  name: 'Kasia',
  relation: 'self',
  birthYear: 1992, // 34
  familyHistory: [],
};

const colonoscopyWait: WaitTimeSummary = {
  examId: 'colonoscopy_screening',
  province: '07',
  radiusKm: 15,
  facilitiesCount: 12,
  p50Days: 60,
  p75Days: 95,
  minDays: 10,
  asOf: '2026-09',
  source: 'nfz_snapshot',
};

const ids = (items: PlanItem[]) => items.map((i) => i.examId);

describe('persona mama (58, F, colorectal cancer in family, remembers nothing)', () => {
  const records: ExamRecord[] = ['colonoscopy_screening', 'mammography'].map((examId) => ({
    profileId: 'mama',
    examId,
    lastDone: 'unknown',
    status: 'none',
    updatedAt: TODAY,
  }));
  const plan = computePlan({
    profile: mama,
    records,
    waitTimes: { colonoscopy_screening: colonoscopyWait },
    today: TODAY,
  });
  const colonoscopy = plan.items.find((i) => i.examId === 'colonoscopy_screening');

  it('is a valid Plan', () => {
    expect(() => PlanSchema.parse(plan)).not.toThrow();
    expect(plan).toMatchObject({ profileId: 'mama', generatedAt: TODAY });
  });

  it('colonoscopy is act_now, using the NFZ wait time', () => {
    expect(colonoscopy).toMatchObject({
      urgency: 'act_now',
      dueDate: TODAY,
      leadTimeDays: 95,
      leadTimeSource: 'nfz_snapshot',
    });
  });

  it('colonoscopy reasons include the family-history note', () => {
    expect(colonoscopy?.reasons).toHaveLength(2);
    expect(colonoscopy?.reasons[1]).toMatch(/histori/i);
  });

  it('includes mammography and the 50+ health check, not PSA, cervical or LDCT', () => {
    expect(ids(plan.items)).toEqual(
      expect.arrayContaining(['mammography', 'health_check_adult_50']),
    );
    expect(ids(plan.items)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^(psa_discussion|lung_ldct)$/)]),
    );
    expect(ids(plan.items)).not.toContain('health_check_adult');
  });
});

describe('persona Kasia (34, F)', () => {
  const plan = computePlan({ profile: kasia, records: [], waitTimes: {}, today: TODAY });

  it('has cervical screening and dental, no colonoscopy or mammography', () => {
    expect(ids(plan.items)).toEqual(
      expect.arrayContaining(['cervical_screening', 'dental_checkup']),
    );
    expect(ids(plan.items)).not.toContain('colonoscopy_screening');
    expect(ids(plan.items)).not.toContain('mammography');
  });

  it('queue exams without wait data fall back to the default lead time', () => {
    expect(plan.items.find((i) => i.examId === 'dental_checkup')?.leadTimeSource).toBe('default');
  });
});

describe('§5 plan-level cases', () => {
  it('person outside the age range → exam not in plan', () => {
    const plan = computePlan({
      profile: { ...mama, familyHistory: [], birthYear: 1990 },
      records: [],
      waitTimes: {},
      today: TODAY,
    });
    expect(ids(plan.items)).not.toContain('colonoscopy_screening');
  });

  it('family-history modifier lowers colonoscopy start to 40', () => {
    const plan = computePlan({
      profile: { ...mama, birthYear: 1985 }, // 41
      records: [],
      waitTimes: {},
      today: TODAY,
    });
    expect(ids(plan.items)).toContain('colonoscopy_screening');
  });

  it('sex excludes the exam (no mammography for a man)', () => {
    const plan = computePlan({
      profile: { ...mama, sex: 'male' },
      records: [],
      waitTimes: {},
      today: TODAY,
    });
    expect(ids(plan.items)).not.toContain('mammography');
    expect(ids(plan.items)).toContain('psa_discussion');
  });

  it('sorted act_now → booked → this_year → later → done, then by notifyDate', () => {
    const rec = (examId: string, r: Partial<ExamRecord>): ExamRecord => ({
      profileId: 'mama',
      examId,
      status: 'none',
      updatedAt: TODAY,
      ...r,
    });
    const plan = computePlan({
      profile: mama,
      records: [
        rec('mammography', { status: 'booked', bookedFor: '2026-10-20' }),
        rec('health_check_adult_50', { lastDone: '2026-08-01', status: 'done' }), // done
        rec('dental_checkup', { lastDone: '2026-03-01' }), // due 2027-03-01 − 60 → this_year
        rec('eye_exam', { lastDone: '2026-01-10' }), // due 2028 → later
        // colonoscopy: no record → act_now
      ],
      waitTimes: {},
      today: TODAY,
    });
    const order = plan.items.map((i) => i.urgency);
    const rank = order.map((u) => URGENCY_ORDER[u]);
    expect(rank).toEqual([...rank].sort((a, b) => a - b));
    expect(new Set(order)).toEqual(new Set(['act_now', 'booked', 'this_year', 'later', 'done']));
    expect([...plan.items].sort(comparePlanItems)).toEqual(plan.items);
    for (let i = 1; i < plan.items.length; i++) {
      const [prev, cur] = [plan.items[i - 1], plan.items[i]];
      if (prev && cur && prev.urgency === cur.urgency) {
        expect(prev.notifyDate <= cur.notifyDate).toBe(true);
      }
    }
  });

  it('ignores records of other profiles', () => {
    const plan = computePlan({
      profile: mama,
      records: [
        {
          profileId: 'kasia',
          examId: 'mammography',
          status: 'booked',
          bookedFor: '2026-10-20',
          updatedAt: TODAY,
        },
      ],
      waitTimes: {},
      today: TODAY,
    });
    expect(plan.items.find((i) => i.examId === 'mammography')?.urgency).not.toBe('booked');
  });
});
