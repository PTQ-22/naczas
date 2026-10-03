import { describe, expect, it } from 'vitest';

import type { ExamRecord, Plan, Profile } from '@naczas/shared';

import { computePlan, visitPrepSummary } from '../src';

const TODAY = '2026-10-03';

const mama: Profile = {
  id: 'mama',
  name: 'Mama',
  relation: 'parent',
  birthYear: 1968,
  sex: 'female',
  conditions: [],
  familyHistory: ['colorectal_cancer'],
  smoking: { status: 'never' },
  createdAt: TODAY,
};

const tomek: Profile = {
  id: 'tomek',
  name: 'Tomek',
  relation: 'partner',
  birthYear: 1981, // 45
  sex: 'male',
  conditions: ['diabetes'],
  familyHistory: [],
  smoking: { status: 'current', packYears: 25 },
  activity: 'low',
  createdAt: TODAY,
};

const planFor = (profile: Profile, records: ExamRecord[] = []): Plan =>
  computePlan({ profile, records, waitTimes: {}, today: TODAY });

describe('visitPrepSummary — persona mama (no referrals needed)', () => {
  const records: ExamRecord[] = [
    {
      profileId: 'mama',
      examId: 'mammography',
      lastDone: '2026-06-15',
      status: 'done',
      updatedAt: TODAY,
    },
  ];
  const summary = visitPrepSummary({
    profile: mama,
    plan: planFor(mama, records),
    records,
    today: TODAY,
  });

  it('describes the person', () => {
    expect(summary.person).toEqual({ name: 'Mama', age: 58, sex: 'female', sexLabel: 'kobieta' });
  });

  it('lists family history as a risk factor', () => {
    expect(summary.riskFactors).toEqual(['Rak jelita grubego w rodzinie']);
  });

  // Her program exams (colonoscopy etc.) need no referral. At 58 she is also eligible for
  // eye_exam (40+) and skin_check (18+), which do — so the list is not empty for the real plan.
  it('program exams need no referral; only eye_exam and skin_check do', () => {
    expect(summary.askForReferral.map((e) => e.examId).sort()).toEqual(['eye_exam', 'skin_check']);
    expect(summary.noReferralNeeded.map((e) => e.examId)).toContain('colonoscopy_screening');
  });

  it('askForReferral is empty once eye_exam and skin_check are not urgent', () => {
    const withChecks: ExamRecord[] = [
      ...records,
      ...['eye_exam', 'skin_check'].map((examId): ExamRecord => ({
        profileId: 'mama',
        examId,
        lastDone: '2026-09-01',
        status: 'done',
        updatedAt: TODAY,
      })),
    ];
    const s = visitPrepSummary({
      profile: mama,
      plan: planFor(mama, withChecks),
      records: withChecks,
      today: TODAY,
    });
    expect(s.askForReferral).toEqual([]);
  });

  it('urgent exams without referral carry the referralNote', () => {
    const colonoscopy = summary.noReferralNeeded.find((e) => e.examId === 'colonoscopy_screening');
    expect(colonoscopy?.name).toBe('Kolonoskopia');
    expect(colonoscopy?.referralNote).toMatch(/bez skierowania/i);
  });

  it('recentlyDone lists done exams with their date', () => {
    expect(summary.recentlyDone).toEqual([
      { examId: 'mammography', name: 'Mammografia', date: '2026-06-15' },
    ]);
    expect(summary.noReferralNeeded.map((e) => e.examId)).not.toContain('mammography');
  });

  it('asks 2–4 neutral questions, incl. one about family history, in the right grammatical form', () => {
    expect(summary.questions.length).toBeGreaterThanOrEqual(2);
    expect(summary.questions.length).toBeLessThanOrEqual(4);
    expect(
      summary.questions.some((q) => q.includes('historię rodzinną') && q.includes('Kolonoskopia')),
    ).toBe(true);
    expect(summary.questions.join(' ')).toMatch(/powinnam/);
    expect(summary.questions.join(' ')).not.toMatch(/powinienem/);
  });
});

describe('visitPrepSummary — persona with eye_exam / skin_check (referral required)', () => {
  const summary = visitPrepSummary({ profile: tomek, plan: planFor(tomek), today: TODAY });

  it('askForReferral lists the referral-only exams with name and reason', () => {
    const ids = summary.askForReferral.map((e) => e.examId).sort();
    expect(ids).toEqual(['eye_exam', 'skin_check']);
    for (const e of summary.askForReferral) {
      expect(e.name.trim()).not.toBe('');
      expect(e.reason.trim()).not.toBe('');
    }
  });

  it('no exam appears in both lists', () => {
    const a = new Set(summary.askForReferral.map((e) => e.examId));
    expect(summary.noReferralNeeded.some((e) => a.has(e.examId))).toBe(false);
  });

  it('labels conditions, smoking with pack-years and low activity', () => {
    expect(summary.riskFactors).toEqual([
      'Cukrzyca',
      'Palenie tytoniu obecnie (paczkolata: 25)',
      'Niska aktywność fizyczna',
    ]);
  });

  it('asks for the referrals and uses the masculine form', () => {
    expect(summary.questions.some((q) => q.includes('skierowanie'))).toBe(true);
    expect(summary.questions.join(' ')).toMatch(/powinienem/);
    expect(summary.person.sexLabel).toBe('mężczyzna');
  });

  it('recentlyDone is empty without records', () => {
    expect(summary.recentlyDone).toEqual([]);
  });
});

describe('visitPrepSummary — family history and smoking details', () => {
  const empty: Plan = { profileId: 'mama', generatedAt: TODAY, items: [] };

  it('asks about the genetic clinic, listing every cancer in the family', () => {
    const s = visitPrepSummary({
      profile: {
        ...mama,
        familyHistory: ['breast_cancer', 'ovarian_cancer', 'endometrial_cancer'],
      },
      plan: empty,
      today: TODAY,
    });
    expect(s.questions).toContain(
      'Czy ze względu na raka piersi, raka jajnika i raka trzonu macicy w rodzinie powinnam skorzystać z porady w poradni genetycznej?',
    );
  });

  it('does not ask about the genetic clinic without family history', () => {
    const s = visitPrepSummary({
      profile: { ...mama, familyHistory: [] },
      plan: empty,
      today: TODAY,
    });
    expect(s.questions.join(' ')).not.toMatch(/genetycznej/);
  });

  it('shows when a former smoker quit and the extra lung risk factor', () => {
    const s = visitPrepSummary({
      profile: {
        ...mama,
        familyHistory: [],
        smoking: { status: 'former', packYears: 30, quitOver15y: false, otherLungRisk: true },
      },
      plan: empty,
      today: TODAY,
    });
    expect(s.riskFactors).toEqual([
      'Palenie tytoniu w przeszłości (paczkolata: 30, rzucone w ciągu ostatnich 15 lat)',
      'Dodatkowy czynnik ryzyka raka płuca',
    ]);
  });
});

describe('visitPrepSummary — edge cases', () => {
  it('former smoker without pack-years', () => {
    const s = visitPrepSummary({
      profile: { ...tomek, conditions: [], activity: 'high', smoking: { status: 'former' } },
      plan: { profileId: 'tomek', generatedAt: TODAY, items: [] },
      today: TODAY,
    });
    expect(s.riskFactors).toEqual(['Palenie tytoniu w przeszłości']);
    expect(s.questions.length).toBeGreaterThanOrEqual(2);
  });

  it('skips booked items, unknown exam ids and records of other profiles / survey answers', () => {
    const s = visitPrepSummary({
      profile: mama,
      plan: {
        profileId: 'mama',
        generatedAt: TODAY,
        items: [
          {
            examId: 'unknown_exam',
            profileId: 'mama',
            dueDate: TODAY,
            notifyDate: TODAY,
            leadTimeDays: 3,
            leadTimeSource: 'default',
            urgency: 'act_now',
            reasons: [],
            overdue: false,
          },
          {
            examId: 'mammography',
            profileId: 'mama',
            dueDate: '2026-10-20',
            notifyDate: '2026-10-19',
            leadTimeDays: 1,
            leadTimeSource: 'default',
            urgency: 'booked',
            reasons: [],
            overdue: false,
          },
        ],
      },
      records: [
        {
          profileId: 'kasia',
          examId: 'mammography',
          lastDone: '2026-01-01',
          status: 'done',
          updatedAt: TODAY,
        },
        {
          profileId: 'mama',
          examId: 'dental_checkup',
          lastDone: 'within_1y',
          status: 'done',
          updatedAt: TODAY,
        },
      ],
      today: TODAY,
    });
    expect(s.noReferralNeeded).toEqual([]);
    expect(s.askForReferral).toEqual([]);
    expect(s.recentlyDone).toEqual([]);
  });
});
