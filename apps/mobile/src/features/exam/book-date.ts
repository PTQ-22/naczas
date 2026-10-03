import { addDays, addYears, format, isValid, parseISO } from 'date-fns';

import type { ExamRecord, ISODate } from '@naczas/shared';

/** Default suggestion when nothing is booked yet: two weeks from today. */
export const DEFAULT_OFFSET_DAYS = 14;

const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');

export function bookingRange(today: ISODate): { min: ISODate; max: ISODate } {
  return { min: today, max: toISO(addYears(parseISO(today), 1)) };
}

/** Existing booking date when changing it, otherwise today + 14 days. */
export function initialBookedFor(today: ISODate, record?: ExamRecord): ISODate {
  if (record?.status === 'booked' && record.bookedFor && record.bookedFor >= today) {
    return record.bookedFor;
  }
  return toISO(addDays(parseISO(today), DEFAULT_OFFSET_DAYS));
}

export type BookDateError = 'invalid' | 'past' | 'tooFar';

/** Web `<input type="date">` can be typed into, so everything is re-checked here. */
export function validateBookedFor(value: string, today: ISODate): BookDateError | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isValid(parseISO(value))) return 'invalid';
  // Round-trip catches dates like 2026-02-30 that parseISO would roll over.
  if (toISO(parseISO(value)) !== value) return 'invalid';
  const { min, max } = bookingRange(today);
  if (value < min) return 'past';
  if (value > max) return 'tooFar';
  return null;
}

/**
 * Record after booking. Keeps `lastDone` so the interval still counts from the last exam if the
 * visit is later cancelled.
 */
export function bookedRecord(input: {
  profileId: string;
  examId: string;
  bookedFor: ISODate;
  today: ISODate;
  existing?: ExamRecord;
}): ExamRecord {
  const { profileId, examId, bookedFor, today, existing } = input;
  return {
    profileId,
    examId,
    ...(existing?.lastDone !== undefined && { lastDone: existing.lastDone }),
    status: 'booked',
    bookedFor,
    updatedAt: today,
  };
}
