import { describe, expect, it } from '@jest/globals';

import type { ExamRecord } from '@naczas/shared';

import type { HealthBet } from '@/store/bet-store';

import { betProgress, resolveBetStatus } from '../resolve-bets';

const makeBet = (overrides: Partial<HealthBet> = {}): HealthBet => ({
  id: 'bet-1',
  profileId: 'p1',
  amountPln: 20,
  createdAt: '2026-09-01',
  expiresAt: '2026-12-31',
  status: 'active',
  examIds: ['colonoscopy', 'blood-pressure'],
  ...overrides,
});

const makeRecord = (
  examId: string,
  status: ExamRecord['status'],
  profileId = 'p1',
): ExamRecord => ({
  profileId,
  examId,
  status,
  updatedAt: '2026-10-01',
});

describe('resolveBetStatus', () => {
  it('returns "won" when all exams are done', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'done'), makeRecord('blood-pressure', 'done')];
    expect(resolveBetStatus(bet, records, '2026-10-15')).toBe('won');
  });

  it('returns "won" when all exams are booked', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'booked'), makeRecord('blood-pressure', 'booked')];
    expect(resolveBetStatus(bet, records, '2026-10-15')).toBe('won');
  });

  it('returns "won" even after deadline if all completed', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'done'), makeRecord('blood-pressure', 'booked')];
    // Completed exams win even if checked after deadline
    expect(resolveBetStatus(bet, records, '2027-01-15')).toBe('won');
  });

  it('returns "lost" when deadline passed and exams are incomplete', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'done')];
    expect(resolveBetStatus(bet, records, '2027-01-01')).toBe('lost');
  });

  it('returns "lost" when deadline passed and no records exist', () => {
    const bet = makeBet();
    expect(resolveBetStatus(bet, [], '2027-02-01')).toBe('lost');
  });

  it('returns "active" when deadline has not passed and exams are incomplete', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'done')];
    expect(resolveBetStatus(bet, records, '2026-10-15')).toBe('active');
  });

  it('returns "active" when no records and deadline is future', () => {
    const bet = makeBet();
    expect(resolveBetStatus(bet, [], '2026-10-15')).toBe('active');
  });

  it('preserves non-active statuses without recalculating', () => {
    const won = makeBet({ status: 'won' });
    expect(resolveBetStatus(won, [], '2027-02-01')).toBe('won');

    const lost = makeBet({ status: 'lost' });
    expect(resolveBetStatus(lost, [], '2026-01-01')).toBe('lost');
  });

  it('ignores records from other profiles', () => {
    const bet = makeBet();
    const records = [
      makeRecord('colonoscopy', 'done', 'other-profile'),
      makeRecord('blood-pressure', 'done', 'other-profile'),
    ];
    expect(resolveBetStatus(bet, records, '2026-10-15')).toBe('active');
  });

  it('treats "none" status as incomplete', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'done'), makeRecord('blood-pressure', 'none')];
    expect(resolveBetStatus(bet, records, '2026-10-15')).toBe('active');
  });
});

describe('betProgress', () => {
  it('counts completed exams', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'done')];
    expect(betProgress(bet, records)).toEqual({ completed: 1, total: 2, ratio: 0.5 });
  });

  it('returns full progress when all done', () => {
    const bet = makeBet();
    const records = [makeRecord('colonoscopy', 'done'), makeRecord('blood-pressure', 'booked')];
    expect(betProgress(bet, records)).toEqual({ completed: 2, total: 2, ratio: 1 });
  });

  it('returns zero progress with no records', () => {
    const bet = makeBet();
    expect(betProgress(bet, [])).toEqual({ completed: 0, total: 2, ratio: 0 });
  });

  it('handles empty examIds gracefully', () => {
    const bet = makeBet({ examIds: [] });
    expect(betProgress(bet, [])).toEqual({ completed: 0, total: 0, ratio: 1 });
  });
});
