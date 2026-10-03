import type { ExamRecord, ISODate } from '@naczas/shared';

import type { BetStatus, HealthBet } from '@/store/bet-store';

/**
 * Pure function: given a bet, the user's exam records and today's date,
 * returns the bet's resolved status.
 *
 * - Won: every exam in the bet is done or booked before the deadline.
 * - Lost: deadline passed and at least one exam is not done/booked.
 * - Active: deadline hasn't passed yet and not all exams are completed.
 *
 * Deterministic: `today` is always passed in (testability + demo time-travel).
 */
export function resolveBetStatus(bet: HealthBet, records: ExamRecord[], today: ISODate): BetStatus {
  if (bet.status !== 'active') return bet.status;

  const allCompleted = bet.examIds.every((examId) => {
    const record = records.find((r) => r.profileId === bet.profileId && r.examId === examId);
    return record !== undefined && (record.status === 'done' || record.status === 'booked');
  });

  if (allCompleted) return 'won';
  if (today > bet.expiresAt) return 'lost';
  return 'active';
}

/** How many of the bet's exams are done or booked. */
export function betProgress(
  bet: HealthBet,
  records: ExamRecord[],
): { completed: number; total: number; ratio: number } {
  const total = bet.examIds.length;
  if (total === 0) return { completed: 0, total: 0, ratio: 1 };

  const completed = bet.examIds.filter((examId) => {
    const record = records.find((r) => r.profileId === bet.profileId && r.examId === examId);
    return record !== undefined && (record.status === 'done' || record.status === 'booked');
  }).length;

  return { completed, total, ratio: completed / total };
}
