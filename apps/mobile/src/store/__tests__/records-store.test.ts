import AsyncStorage from '@react-native-async-storage/async-storage';

import { ExamRecordSchema } from '@naczas/shared';

import { makeRecord } from '../__fixtures__/fixtures';
import { findRecord, recordsForProfile, useRecordsStore } from '../records-store';
import { useSettingsStore } from '../settings-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const store = () => useRecordsStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  store().reset();
});

describe('records store', () => {
  it('keeps one record per profile + exam', () => {
    store().upsertRecord(makeRecord());
    store().upsertRecord(makeRecord({ status: 'booked', bookedFor: '2027-01-12' }));

    expect(store().records).toHaveLength(1);
    expect(findRecord(store().records, 'p-mama', 'colonoscopy_screening')?.status).toBe('booked');
  });

  it('keeps separate records for different exams and profiles', () => {
    store().upsertRecord(makeRecord());
    store().upsertRecord(makeRecord({ examId: 'mammography' }));
    store().upsertRecord(makeRecord({ profileId: 'p-kasia' }));

    expect(store().records).toHaveLength(3);
    expect(recordsForProfile(store().records, 'p-mama')).toHaveLength(2);
  });

  it('removes all records of one profile', () => {
    store().upsertRecord(makeRecord());
    store().upsertRecord(makeRecord({ profileId: 'p-kasia' }));
    store().removeRecordsForProfile('p-mama');

    expect(store().records.map((r) => r.profileId)).toEqual(['p-kasia']);
  });
});

describe('exam status actions', () => {
  const P = 'p-mama';
  const COLO = 'colonoscopy_screening';
  const record = () => findRecord(store().records, P, COLO);

  beforeEach(() => {
    useSettingsStore.getState().setTodayOverride('2026-10-04');
  });

  it('markBooked keeps lastDone and stamps updatedAt with today', () => {
    store().upsertRecord(makeRecord({ lastDone: 'over_3y' }));
    store().markBooked(P, COLO, '2027-01-12');

    expect(record()).toEqual({
      profileId: P,
      examId: COLO,
      lastDone: 'over_3y',
      status: 'booked',
      bookedFor: '2027-01-12',
      updatedAt: '2026-10-04',
    });
  });

  it('markBooked works for an exam without any record yet', () => {
    store().markBooked(P, COLO, '2027-01-12');
    expect(record()).toEqual({
      profileId: P,
      examId: COLO,
      status: 'booked',
      bookedFor: '2027-01-12',
      updatedAt: '2026-10-04',
    });
  });

  it('markDone sets lastDone to the date and drops the booking', () => {
    store().markBooked(P, COLO, '2027-01-12');
    store().markDone(P, COLO, '2027-01-12');

    expect(record()).toEqual({
      profileId: P,
      examId: COLO,
      lastDone: '2027-01-12',
      status: 'done',
      updatedAt: '2026-10-04',
    });
  });

  it('setLastDone corrects the date and keeps status and booking', () => {
    store().markBooked(P, COLO, '2027-01-12');
    store().setLastDone(P, COLO, '2020-05-01');

    expect(record()).toMatchObject({
      lastDone: '2020-05-01',
      status: 'booked',
      bookedFor: '2027-01-12',
    });
  });

  it('every action produces a contract-valid record', () => {
    store().markBooked(P, COLO, '2027-01-12');
    store().setLastDone(P, COLO, 'within_1y');
    store().markDone(P, 'mammography', '2026-10-01');
    store().records.forEach((r) => ExamRecordSchema.parse(r));
  });

  it('undo restores the record from before the last action', () => {
    store().upsertRecord(makeRecord({ lastDone: 'unknown' }));
    store().markDone(P, COLO, '2026-10-04');

    expect(store().undo(P, COLO)).toBe(true);
    expect(record()).toEqual(makeRecord({ lastDone: 'unknown' }));
  });

  it('undo removes a record that the action created', () => {
    store().markBooked(P, COLO, '2027-01-12');

    expect(store().undo(P, COLO)).toBe(true);
    expect(record()).toBeUndefined();
  });

  it('undo is one step and per exam', () => {
    store().markBooked(P, COLO, '2027-01-12');
    store().markDone(P, 'mammography', '2026-10-01');

    expect(store().undo(P, COLO)).toBe(true);
    expect(store().undo(P, COLO)).toBe(false);
    expect(findRecord(store().records, P, 'mammography')?.status).toBe('done');
  });

  it('does not persist the undo stack', async () => {
    store().markBooked(P, COLO, '2027-01-12');
    const raw = await AsyncStorage.getItem('naczas:records');
    expect(JSON.parse(raw ?? '{}')).not.toHaveProperty('state.undoStack');
  });
});
