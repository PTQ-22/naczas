import { describe, expect, it } from 'vitest';

import { mockProfileMama } from '@naczas/rules';
import type { ExamRecord } from '@naczas/shared';

import { PushSchema } from '../src/routes/sync';
import {
  familyFromRows,
  profileRowId,
  profileRows,
  recordRows,
  type RecordRow,
} from '../src/routes/sync-mapping';

const mama = { ...mockProfileMama, id: 'demo-mama' };
const booked: ExamRecord = {
  profileId: 'demo-mama',
  examId: 'mammography',
  status: 'booked',
  bookedFor: '2026-10-20',
  updatedAt: '2026-10-04',
};
const none: ExamRecord = {
  profileId: 'demo-mama',
  examId: 'colonoscopy_screening',
  status: 'none',
  lastDone: 'never',
  updatedAt: '2026-10-04',
};

describe('sync mapping', () => {
  it('scopes row ids by family, so two families with "demo-mama" never collide', () => {
    expect(profileRows('AAA', [mama])[0]?.id).toBe('AAA:demo-mama');
    expect(profileRows('BBB', [mama])[0]?.id).toBe('BBB:demo-mama');
    expect(recordRows('AAA', [booked])[0]).toMatchObject({
      id: 'AAA:demo-mama|mammography',
      profileId: 'AAA:demo-mama',
      lastDone: null,
      bookedTime: null,
    });
  });

  it('round-trips through DB rows without NULLs leaking into the domain model', () => {
    const family = familyFromRows(profileRows('AAA', [mama]), recordRows('AAA', [booked, none]));
    expect(family.profiles).toEqual([mama]);
    expect(family.records).toEqual([booked, none]);
    for (const r of family.records) expect(Object.values(r)).not.toContain(null);
  });

  it('reads legacy rows written with bare ids, preferring the scoped copy', () => {
    const legacyProfile = { id: 'demo-mama', familyCode: 'AAA', payload: JSON.stringify(mama) };
    const legacyRecord: RecordRow = {
      ...recordRows('AAA', [booked])[0]!,
      id: 'demo-mama|mammography',
      profileId: 'demo-mama',
    };
    const renamed = { ...mama, name: 'Mama (nowa)' };
    const family = familyFromRows(
      [legacyProfile, ...profileRows('AAA', [renamed])],
      [legacyRecord],
    );
    expect(family.profiles).toEqual([renamed]);
    expect(family.records).toEqual([booked]);
  });

  it('drops rows that no longer parse instead of breaking the client', () => {
    const family = familyFromRows(
      [{ id: profileRowId('AAA', 'x'), familyCode: 'AAA', payload: '{"id":"x"}' }],
      [],
    );
    expect(family.profiles).toEqual([]);
  });
});

describe('push payload', () => {
  it('accepts NULLs that older app versions pulled from the DB and send back', () => {
    const parsed = PushSchema.parse({
      familyCode: 'AAA',
      profiles: [mama],
      records: [{ ...booked, lastDone: null, bookedTime: null }],
    });
    expect(parsed.records[0]).toEqual(booked);
  });

  it('still rejects a malformed record', () => {
    expect(
      PushSchema.safeParse({ familyCode: 'AAA', profiles: [], records: [{ examId: 1 }] }).success,
    ).toBe(false);
  });
});
