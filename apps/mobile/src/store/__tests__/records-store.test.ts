import AsyncStorage from '@react-native-async-storage/async-storage';

import { makeRecord } from '../__fixtures__/fixtures';
import { findRecord, recordsForProfile, useRecordsStore } from '../records-store';

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
