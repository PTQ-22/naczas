import type { ExamRecord } from '@naczas/shared';

import { bookingRange, initialBookedFor, validateBookedFor } from '../book-date';

const TODAY = '2026-10-03';

const record = (r: Partial<ExamRecord>): ExamRecord => ({
  profileId: 'p',
  examId: 'eye_exam',
  status: 'none',
  updatedAt: TODAY,
  ...r,
});

describe('book-date', () => {
  it('range is today … today + 1 year', () => {
    expect(bookingRange(TODAY)).toEqual({ min: '2026-10-03', max: '2027-10-03' });
  });

  it('defaults to today + 14 days, or the existing future booking', () => {
    expect(initialBookedFor(TODAY)).toBe('2026-10-17');
    expect(initialBookedFor(TODAY, record({ status: 'booked', bookedFor: '2026-11-05' }))).toBe(
      '2026-11-05',
    );
    // A past booking is not a sensible default for a new one.
    expect(initialBookedFor(TODAY, record({ status: 'booked', bookedFor: '2026-09-01' }))).toBe(
      '2026-10-17',
    );
  });

  it.each([
    ['2026-10-03', null],
    ['2027-10-03', null],
    ['2026-10-02', 'past'],
    ['2027-10-04', 'tooFar'],
    ['', 'invalid'],
    ['2026-10', 'invalid'],
    ['2026-02-30', 'invalid'],
    ['abc', 'invalid'],
  ] as const)('validate %j → %s', (value, expected) => {
    expect(validateBookedFor(value, TODAY)).toBe(expected);
  });
});
