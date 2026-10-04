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
  availabilityOn,
  describeAvailability,
  describeBlocked,
  isAvailabilityEmpty,
  isBlocked,
  slotFits,
  spokenDayDate,
  upcomingWindows,
  firstAvailableSlot,
  simulateCallAssist,
  SIMULATION_SPEEDUP,
  simulatedSlotDate,
  WaitTimeSummarySchema,
  type CallAvailability,
  type Profile,
} from '../src';

/** Natural-pace ms → simulated ms (the demo runs SIMULATION_SPEEDUP× faster). */
const f = (ms: number) => Math.round(ms / SIMULATION_SPEEDUP);

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

  it('parses availability and rejects a window that ends before it starts', () => {
    const availability = {
      weekly: [{ days: [1, 2, 3, 4, 5], from: '17:00', to: '20:00' }],
      dates: [{ date: '2026-10-21', from: '09:00', to: '12:00' }],
    };
    expect(CallAssistRequestSchema.parse({ ...request, availability })).toMatchObject({
      availability,
    });
    const bad = { ...availability, weekly: [{ days: [1], from: '20:00', to: '17:00' }] };
    expect(CallAssistRequestSchema.safeParse({ ...request, availability: bad }).success).toBe(
      false,
    );
    const noDays = { ...availability, weekly: [{ days: [], from: '17:00', to: '20:00' }] };
    expect(CallAssistRequestSchema.safeParse({ ...request, availability: noDays }).success).toBe(
      false,
    );
  });

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
    expect(simulateCallAssist('s', req, '2026-10-04', f(4000)).status).toBe('on_hold');
    const mid = simulateCallAssist('s', req, '2026-10-04', f(10_000));
    expect(mid.status).toBe('in_progress');
    expect(mid.transcript[0]?.text).toBe('Rejestracja, słucham.');
    expect(mid.transcript[1]?.text).toMatch(/asystentem AI.*w imieniu Kasi/);
    const end = simulateCallAssist('s', req, '2026-10-04', f(60_000));
    expect(end).toMatchObject({ status: 'ended', result: { booked: true, date: '2026-10-19' } });
    expect(end.transcript.at(-2)?.text).toContain('19 października o 10:30');
  });

  it('moves a weekend slot to Monday', () => {
    expect(simulatedSlotDate('2026-10-03')).toBe('2026-10-19'); // Sat + 14 = Sat → Mon
    expect(simulatedSlotDate('2026-10-05')).toBe('2026-10-19'); // Mon + 14 = Mon
  });
});

describe('availability', () => {
  const av: CallAvailability = {
    weekly: [{ days: [1, 2, 3, 4, 5], from: '17:00', to: '20:00' }],
    dates: [
      { date: '2026-10-21', from: '13:00', to: '15:00' },
      { date: '2026-10-21', from: '08:00', to: '10:00' },
    ],
  };

  it('adds one-off hours to the weekly ones on that day', () => {
    expect(availabilityOn(av, '2026-10-21')).toEqual([
      { from: '08:00', to: '10:00' },
      { from: '13:00', to: '15:00' },
      { from: '17:00', to: '20:00' },
    ]);
    expect(availabilityOn(av, '2026-10-20')).toEqual([{ from: '17:00', to: '20:00' }]); // Tue
    expect(availabilityOn(av, '2026-10-24')).toEqual([]); // Sat
  });

  it('finds the first free slot from a given day', () => {
    expect(firstAvailableSlot(av, '2026-10-17')).toEqual({ date: '2026-10-19', time: '17:00' });
    expect(firstAvailableSlot({ weekly: [], dates: [] }, '2026-10-17')).toBeNull();
  });

  it('describes the rules in Polish and skips past dates', () => {
    expect(describeAvailability(av, '2026-10-04')).toEqual([
      'w dni robocze 17:00–20:00',
      '21 października 08:00–10:00 i 13:00–15:00',
    ]);
    expect(describeAvailability(av, '2026-10-22')).toEqual(['w dni robocze 17:00–20:00']);
    expect(
      describeAvailability(
        { weekly: [{ days: [6, 2], from: '07:00', to: '12:00' }], dates: [] },
        '2026-10-04',
      ),
    ).toEqual(['w wtorki, soboty 07:00–12:00']);
  });

  it('the simulated clinic offers a slot that fits the calendar', () => {
    const req = {
      examName: 'kolonoskopię',
      facilityName: 'X',
      forWhom: 'mamę',
      callerName: 'Kasi',
    };
    const end = simulateCallAssist('s', { ...req, availability: av }, '2026-10-04', f(60_000));
    // The clinic offers Mon 19.10 at 10:30 (14 days out, off the weekend) — outside 17–20, so the
    // agent declines and counter-proposes the first fitting time from the calendar.
    expect(end.result).toMatchObject({ booked: true, date: '2026-10-19', time: '17:00' });
    const lines = end.transcript.map((l) => l.text);
    expect(lines[4]).toBe('Mam wolne 19 października o 10:30.');
    expect(lines[5]).toMatch(
      /^Niestety to poza godzinami.*czy byłoby możliwe 19 października o 17:00\?/,
    );
    expect(lines[6]).toContain('19 października o 17:00 jest wolne');
    expect(lines[7]).toContain('potwierdzam: 19 października o 17:00');
  });

  it('negotiation takes longer; a fitting offer is accepted straight away', () => {
    const req = {
      examName: 'kolonoskopię',
      facilityName: 'X',
      forWhom: 'mamę',
      callerName: 'Kasi',
    };
    expect(
      simulateCallAssist('s', { ...req, availability: av }, '2026-10-04', f(25_000)).status,
    ).toBe('in_progress');
    const morning: CallAvailability = {
      weekly: [{ days: [1], from: '09:00', to: '12:00' }],
      dates: [],
    };
    const end = simulateCallAssist('s', { ...req, availability: morning }, '2026-10-04', f(60_000));
    expect(end.result).toMatchObject({ date: '2026-10-19', time: '10:30' });
    expect(end.transcript.map((l) => l.text).join(' ')).not.toContain('Niestety');
  });

  describe('blocked hours', () => {
    const blocked: CallAvailability = {
      ...av,
      blocked: { weekly: [{ days: [1], from: '17:00', to: '18:30' }], dates: [] },
    };
    const req = {
      examName: 'kolonoskopię',
      facilityName: 'X',
      forWhom: 'mamę',
      callerName: 'Kasi',
    };

    it('are cut out of the free hours (may split a window)', () => {
      expect(availabilityOn(blocked, '2026-10-19')).toEqual([{ from: '18:30', to: '20:00' }]);
      const middle: CallAvailability = {
        ...av,
        blocked: { weekly: [], dates: [{ date: '2026-10-20', from: '18:00', to: '19:00' }] },
      };
      expect(availabilityOn(middle, '2026-10-20')).toEqual([
        { from: '17:00', to: '18:00' },
        { from: '19:00', to: '20:00' },
      ]);
      expect(availabilityOn(blocked, '2026-10-20')).toEqual([{ from: '17:00', to: '20:00' }]);
    });

    it('move the first free slot past them', () => {
      expect(firstAvailableSlot(blocked, '2026-10-17')).toEqual({
        date: '2026-10-19',
        time: '18:30',
      });
    });

    it('make the availability non-empty and are described separately', () => {
      const onlyBlocked: CallAvailability = { weekly: [], dates: [], blocked: blocked.blocked };
      expect(isAvailabilityEmpty(onlyBlocked)).toBe(false);
      expect(isAvailabilityEmpty({ weekly: [], dates: [] })).toBe(true);
      expect(isBlocked(onlyBlocked, '2026-10-19', '17:30')).toBe(true);
      expect(isBlocked(onlyBlocked, '2026-10-19', '18:30')).toBe(false);
      expect(describeBlocked(blocked, '2026-10-04')).toEqual(['w poniedziałki 17:00–18:30']);
      expect(describeBlocked(av, '2026-10-04')).toEqual([]);
    });

    it('the simulated clinic skips a blocked day when only "can\'t" hours are marked', () => {
      const onlyBlocked: CallAvailability = {
        weekly: [],
        dates: [],
        // 14 days out from 04.10 is Mon 19.10 (after the weekend shift) — block its 10:30.
        blocked: { weekly: [], dates: [{ date: '2026-10-19', from: '08:00', to: '12:00' }] },
      };
      const end = simulateCallAssist(
        's',
        { ...req, availability: onlyBlocked },
        '2026-10-04',
        60_000,
      );
      expect(end.result).toMatchObject({ booked: true, date: '2026-10-20', time: '10:30' });
      expect(end.transcript[5]?.text).toMatch(/^Niestety wtedy na pewno nie damy rady/);
      expect(end.transcript[5]?.text).toContain('Na pewno nie możemy: 19 października 08:00–12:00');
    });

    it('slotFits checks free hours and blocked hours', () => {
      expect(slotFits(blocked, '2026-10-19', '17:00')).toBe(false); // blocked Mon 17–18:30
      expect(slotFits(blocked, '2026-10-19', '19:00')).toBe(true);
      expect(slotFits(blocked, '2026-10-19', '10:00')).toBe(false); // outside free hours
      expect(slotFits({ weekly: [], dates: [] }, '2026-10-19', '10:00')).toBe(true);
    });

    it('upcomingWindows lists concrete windows for the agent, blocked hours cut out', () => {
      expect(upcomingWindows(blocked, '2026-10-19', 2)).toEqual([
        { date: '2026-10-19', from: '18:30', to: '20:00' },
        { date: '2026-10-20', from: '17:00', to: '20:00' },
      ]);
      expect(upcomingWindows(blocked, '2026-10-19', 30, 3)).toHaveLength(3);
      expect(spokenDayDate('2026-10-19')).toBe('poniedziałek 19 października');
    });

    it('parse in a request and old requests without them still parse', () => {
      expect(CallAssistRequestSchema.parse({ ...req, availability: blocked }).availability).toEqual(
        blocked,
      );
      expect(CallAssistRequestSchema.parse({ ...req, availability: av }).availability).toEqual(av);
    });
  });
});
