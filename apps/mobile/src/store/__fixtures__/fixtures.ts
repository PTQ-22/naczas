import type { ExamRecord, Profile } from '@naczas/shared';

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'p-mama',
    name: 'Mama',
    relation: 'parent',
    birthYear: 1968,
    sex: 'female',
    conditions: [],
    familyHistory: ['colorectal_cancer'],
    smoking: { status: 'never' },
    createdAt: '2026-10-04',
    ...overrides,
  };
}

export function makeRecord(overrides: Partial<ExamRecord> = {}): ExamRecord {
  return {
    profileId: 'p-mama',
    examId: 'colonoscopy_screening',
    lastDone: 'unknown',
    status: 'none',
    updatedAt: '2026-10-04',
    ...overrides,
  };
}
