import { MOCK_TODAY, getExamRule, mockPlan } from '@naczas/rules';
import type { ExamRule, PlanItem, WaitTimeSummary } from '@naczas/shared';

import {
  examCtas,
  frequencyMessage,
  queueInfo,
  referralText,
  timingMessages,
} from '../exam-view-model';

const plan = mockPlan({ today: MOCK_TODAY });
const itemFor = (examId: string): PlanItem => {
  const item = plan.items.find((i) => i.examId === examId);
  if (!item) throw new Error(`no mock item ${examId}`);
  return item;
};
const colonoscopy = getExamRule('colonoscopy_screening');

describe('frequencyMessage', () => {
  it.each([
    [6, 'exam.frequency.months', 6],
    [12, 'exam.frequency.oneYear', undefined],
    [24, 'exam.frequency.years', 2],
    [36, 'exam.frequency.years', 3],
    [60, 'exam.frequency.yearsMany', 5],
    [120, 'exam.frequency.yearsMany', 10],
    [18, 'exam.frequency.months', 18],
  ] as const)('%i months → %s', (months, key, count) => {
    const m = frequencyMessage(months);
    expect(m.key).toBe(key);
    expect(m.params?.count).toBe(count);
  });
});

describe('referralText', () => {
  it('uses referralNote when present', () => {
    expect(referralText(colonoscopy)).toBe(colonoscopy.referralNote);
  });

  it('falls back to the referral flag', () => {
    const rule: ExamRule = { ...colonoscopy, referralNote: undefined, referral: true };
    expect(referralText(rule)).toEqual({ key: 'exam.referral.required' });
    expect(referralText({ ...rule, referral: false })).toEqual({
      key: 'exam.referral.notRequired',
    });
  });
});

describe('timingMessages', () => {
  it('act_now: due month + start now', () => {
    expect(timingMessages(itemFor('colonoscopy_screening'), MOCK_TODAY).map((m) => m.key)).toEqual([
      'exam.dueBy',
      'exam.startNow',
    ]);
  });

  it('this_year: start from notifyDate', () => {
    const [, start] = timingMessages(itemFor('eye_exam'), MOCK_TODAY);
    expect(start).toEqual({ key: 'exam.startFrom', params: { date: '18.10.2026' } });
  });

  it('booked: visit date only', () => {
    expect(timingMessages(itemFor('mammography'), MOCK_TODAY)).toEqual([
      { key: 'exam.bookedFor', params: { date: '15.10.2026' } },
    ]);
  });
});

describe('queueInfo', () => {
  const summary: WaitTimeSummary = {
    examId: 'colonoscopy_screening',
    province: '07',
    radiusKm: 25,
    facilitiesCount: 12,
    p50Days: 70,
    p75Days: 84,
    minDays: 20,
    asOf: '2026-09',
    source: 'nfz_snapshot',
  };

  it('prefers the NFZ summary', () => {
    expect(queueInfo(colonoscopy, itemFor('colonoscopy_screening'), summary)).toEqual({
      hasData: true,
      lines: {
        label: { key: 'exam.queue.radius', params: { km: 25 } },
        value: { key: 'exam.queue.weeks', params: { weeks: 10 } },
        meta: { key: 'exam.queue.asOf', params: { date: '2026-09' } },
      },
    });
  });

  it('falls back to lead time; default source → "no data" box', () => {
    expect(queueInfo(colonoscopy, itemFor('colonoscopy_screening'), undefined)?.hasData).toBe(true);
    const eye = getExamRule('eye_exam');
    const info = queueInfo(eye, itemFor('eye_exam'), undefined);
    expect(info).toEqual({
      hasData: false,
      lines: { label: { key: 'exam.queue.noData', params: { weeks: 9 } } },
    });
  });

  it('is hidden for non-queue exams', () => {
    expect(queueInfo(getExamRule('mammography'), itemFor('mammography'), undefined)).toBeNull();
  });
});

describe('examCtas', () => {
  it('queue, not booked → find slot + "Umówiłem/am się"', () => {
    expect(examCtas(colonoscopy, itemFor('colonoscopy_screening'))).toEqual({
      primary: { action: 'facilities', label: { key: 'exam.cta.findSlot' } },
      ghost: { action: 'book', label: { key: 'exam.cta.booked' } },
    });
  });

  it('booked → mark done + change date', () => {
    const ctas = examCtas(getExamRule('mammography'), itemFor('mammography'));
    expect(ctas.primary?.action).toBe('markDone');
    expect(ctas.ghost?.label.key).toBe('exam.cta.changeDate');
  });

  it('done → no primary', () => {
    const ctas = examCtas(getExamRule('health_check_adult'), itemFor('health_check_adult'));
    expect(ctas.primary).toBeUndefined();
    expect(ctas.ghost?.label.key).toBe('exam.cta.doneEarlier');
  });

  it('program / walk_in without plan item', () => {
    expect(examCtas(getExamRule('mammography'), undefined).primary?.action).toBe('program');
    expect(examCtas(getExamRule('psa_discussion'), undefined)).toEqual({
      primary: { action: 'markDone', label: { key: 'exam.cta.markDone' } },
    });
  });
});
