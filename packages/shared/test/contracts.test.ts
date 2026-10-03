import { describe, expect, it } from 'vitest';

import {
  ApiErrorSchema,
  CallAssistRequestSchema,
  CallAssistStatusSchema,
  ExamRecordSchema,
  ExamRuleSchema,
  FacilitiesResponseSchema,
  HealthResponseSchema,
  PlanSchema,
  ProfileSchema,
  simulateCallAssist,
  simulatedSlotDate,
  WaitTimeSummarySchema,
  type Profile,
} from '../src';

const profile: Profile = {
  id: 'p1',
  name: 'Mama',
  relation: 'parent',
  birthYear: 1968,
  sex: 'female',
  location: { province: '07', lat: 52.23, lng: 21.01, label: 'Warszawa' },
  conditions: ['diabetes'],
  familyHistory: ['colorectal_cancer'],
  smoking: { status: 'never' },
  activity: 'medium',
  createdAt: '2026-10-04',
};

const facilitiesResponse = {
  examId: 'colonoscopy_screening',
  source: 'nfz_snapshot',
  items: [
    {
      id: 'q-123',
      benefit: 'PORADNIA GASTROENTEROLOGICZNA',
      providerName: 'Szpital Bielański',
      placeName: 'Pracownia endoskopii',
      address: 'ul. Cegłowska 80',
      locality: 'Warszawa',
      phone: null,
      lat: 52.29,
      lng: 20.95,
      distanceKm: 6.4,
      firstAvailableDate: '2026-12-15',
      waitDays: 72,
      awaiting: 140,
      anesthesia: true,
      accessibility: { ramp: true, elevator: true, parking: false, toilet: true },
      asOf: '2026-09-30',
    },
  ],
};

describe('ProfileSchema', () => {
  it('parses a valid profile', () => {
    expect(ProfileSchema.parse(profile)).toEqual(profile);
  });

  it('accepts a minimal profile without optional fields', () => {
    const { location: _l, activity: _a, ...minimal } = profile;
    expect(ProfileSchema.safeParse(minimal).success).toBe(true);
  });

  it.each([
    ['unknown province code', { location: { ...profile.location, province: '17' } }],
    ['non-ISO createdAt', { createdAt: '04.10.2026' }],
    ['unknown condition', { conditions: ['cancer'] }],
    ['unknown smoking status', { smoking: { status: 'sometimes' } }],
  ])('rejects %s', (_name, patch) => {
    expect(ProfileSchema.safeParse({ ...profile, ...patch }).success).toBe(false);
  });

  it('rejects a profile missing required fields', () => {
    const { sex: _s, ...noSex } = profile;
    expect(ProfileSchema.safeParse(noSex).success).toBe(false);
  });
});

describe('ExamRecordSchema', () => {
  const base = { profileId: 'p1', examId: 'mammography', status: 'none', updatedAt: '2026-10-04' };

  it('accepts lastDone as ISO date or an undated answer, not a survey bucket', () => {
    expect(ExamRecordSchema.safeParse({ ...base, lastDone: '2024-05-01' }).success).toBe(true);
    expect(ExamRecordSchema.safeParse({ ...base, lastDone: 'over_interval' }).success).toBe(true);
    // Buckets are relative to the answer day — saving the survey turns them into a date.
    expect(ExamRecordSchema.safeParse({ ...base, lastDone: 'within_interval' }).success).toBe(
      false,
    );
  });

  it('rejects an unknown lastDone value', () => {
    expect(ExamRecordSchema.safeParse({ ...base, lastDone: 'yesterday' }).success).toBe(false);
  });
});

describe('FacilitiesResponseSchema', () => {
  it('parses a sample payload', () => {
    expect(FacilitiesResponseSchema.parse(facilitiesResponse)).toEqual(facilitiesResponse);
  });

  it('rejects an unknown source', () => {
    const bad = { ...facilitiesResponse, source: 'cache' };
    expect(FacilitiesResponseSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a facility without accessibility info', () => {
    const { accessibility: _a, ...facility } = facilitiesResponse.items[0]!;
    const bad = { ...facilitiesResponse, items: [facility] };
    expect(FacilitiesResponseSchema.safeParse(bad).success).toBe(false);
  });

  it('reads a facility without anesthesia (older API) as anesthesia: null', () => {
    const { anesthesia: _a, ...facility } = facilitiesResponse.items[0]!;
    const parsed = FacilitiesResponseSchema.parse({ ...facilitiesResponse, items: [facility] });
    expect(parsed.items[0]!.anesthesia).toBeNull();
  });

  it('rejects a non-boolean anesthesia flag', () => {
    const facility = { ...facilitiesResponse.items[0]!, anesthesia: 'Y' };
    const bad = { ...facilitiesResponse, items: [facility] };
    expect(FacilitiesResponseSchema.safeParse(bad).success).toBe(false);
  });
});

describe('WaitTimeSummarySchema', () => {
  it('parses a summary with null stats', () => {
    const summary = {
      examId: 'colonoscopy_screening',
      province: '07',
      radiusKm: 50,
      facilitiesCount: 0,
      p50Days: null,
      p75Days: null,
      minDays: null,
      asOf: '2026-09',
      source: 'nfz_live',
    };
    expect(WaitTimeSummarySchema.parse(summary)).toEqual(summary);
  });
});

describe('ExamRuleSchema', () => {
  const rule = {
    id: 'colonoscopy_screening',
    name: 'Kolonoskopia',
    shortReason: 'Wykrywa polipy, zanim staną się groźne.',
    description: 'Badanie jelita grubego.',
    eligibility: { age: [50, 65], requiresAny: ['colorectal_cancer', 'smoker_20py'] },
    modifiers: [{ when: 'colorectal_cancer', age: [40, 49], note: 'Historia rodzinna.' }],
    intervalMonths: 120,
    booking: 'queue',
    referral: true,
    nfzBenefits: ['KOLONOSKOPIA'],
    source: { name: 'Program badań przesiewowych', url: 'https://example.org' },
    verified: false,
  };

  it('parses a rule', () => {
    expect(ExamRuleSchema.parse(rule)).toEqual(rule);
  });

  it('rejects a rule without source', () => {
    const { source: _s, ...noSource } = rule;
    expect(ExamRuleSchema.safeParse(noSource).success).toBe(false);
  });

  it('accepts an age-only modifier (no `when`) and referralNote', () => {
    const ageOnly = {
      ...rule,
      modifiers: [{ age: [50, 120], intervalMonths: 36, note: 'Od 50 lat co 3 lata.' }],
      referralNote: 'Nie potrzebujesz skierowania.',
    };
    expect(ExamRuleSchema.parse(ageOnly)).toEqual(ageOnly);
  });

  it('rejects a modifier without note', () => {
    const bad = { ...rule, modifiers: [{ age: [50, 120], intervalMonths: 36 }] };
    expect(ExamRuleSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects low_activity in eligibility (allowed only in modifiers)', () => {
    const bad = { ...rule, eligibility: { requiresAny: ['low_activity'] } };
    expect(ExamRuleSchema.safeParse(bad).success).toBe(false);
  });
});

describe('PlanSchema', () => {
  it('parses a plan', () => {
    const plan = {
      profileId: 'p1',
      generatedAt: '2026-10-04',
      items: [
        {
          examId: 'colonoscopy_screening',
          profileId: 'p1',
          dueDate: '2026-12-31',
          notifyDate: '2026-10-01',
          leadTimeDays: 91,
          leadTimeSource: 'nfz_snapshot',
          urgency: 'act_now',
          reasons: ['Wiek 58 lat'],
          overdue: false,
        },
      ],
    };
    expect(PlanSchema.parse(plan)).toEqual(plan);
  });
});

describe('API envelopes', () => {
  it('parses an error body', () => {
    const body = { error: { code: 'validation_error', message: 'Bad province' } };
    expect(ApiErrorSchema.parse(body)).toEqual(body);
  });

  it('health requires ok: true', () => {
    expect(
      HealthResponseSchema.safeParse({ ok: true, nfz: 'down', snapshotAsOf: '2026-09' }).success,
    ).toBe(true);
    expect(
      HealthResponseSchema.safeParse({ ok: false, nfz: 'down', snapshotAsOf: '2026-09' }).success,
    ).toBe(false);
  });
});

describe('CallAssist schemas', () => {
  const request = {
    examName: 'kolonoskopia',
    facilityName: 'Szpital Bielański',
    forWhom: 'mamę',
    callerName: 'Kasia',
    bookBy: '2026-12-01',
  };

  it('parses a request and rejects an empty exam name', () => {
    expect(CallAssistRequestSchema.parse(request)).toEqual(request);
    expect(CallAssistRequestSchema.safeParse({ ...request, examName: ' ' }).success).toBe(false);
  });

  it('parses an ended call with a result and rejects a malformed time', () => {
    const status = {
      callId: 'c1',
      status: 'ended',
      transcript: [{ role: 'agent', text: 'Dzień dobry' }],
      result: { booked: true, date: '2026-10-18', time: '10:30', note: null },
    };
    expect(CallAssistStatusSchema.parse(status)).toEqual(status);
    const bad = { ...status, result: { ...status.result, time: '10.30' } };
    expect(CallAssistStatusSchema.safeParse(bad).success).toBe(false);
  });
});

describe('simulateCallAssist', () => {
  const req = { examName: 'kolonoskopię', facilityName: 'X', forWhom: 'mamę', callerName: 'Kasi' };

  it('rings, talks, then ends with a booked weekday slot two weeks out', () => {
    expect(simulateCallAssist('s', req, '2026-10-04', 0).status).toBe('ringing');
    const mid = simulateCallAssist('s', req, '2026-10-04', 8000);
    expect(mid.status).toBe('in_progress');
    expect(mid.transcript[0]?.text).toMatch(/asystentem AI.*w imieniu Kasi/);
    const end = simulateCallAssist('s', req, '2026-10-04', 60_000);
    expect(end).toMatchObject({ status: 'ended', result: { booked: true, date: '2026-10-19' } });
    expect(end.transcript.at(-2)?.text).toContain('19 października o 10:30');
  });

  it('moves a weekend slot to Monday', () => {
    expect(simulatedSlotDate('2026-10-03')).toBe('2026-10-19'); // Sat + 14 = Sat → Mon
    expect(simulatedSlotDate('2026-10-05')).toBe('2026-10-19'); // Mon + 14 = Mon
  });
});
