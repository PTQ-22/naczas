import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ISODateSchema } from '@naczas/shared';

import { validatedPersist } from './persist';

export const BetStatusSchema = z.enum(['active', 'won', 'lost']);
export type BetStatus = z.infer<typeof BetStatusSchema>;

export const HealthBetSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  /** Symbolic amount in PLN — no real payment in MVP. */
  amountPln: z.number(),
  createdAt: ISODateSchema,
  /** Deadline: all exams must be done/booked by this date. */
  expiresAt: ISODateSchema,
  status: BetStatusSchema,
  /** IDs of exams the bet covers. */
  examIds: z.array(z.string()),
});
export type HealthBet = z.infer<typeof HealthBetSchema>;

const PersistedBetsSchema = z.object({
  bets: z.array(HealthBetSchema),
});
type PersistedBets = z.infer<typeof PersistedBetsSchema>;

interface BetState extends PersistedBets {
  placeBet: (bet: HealthBet) => void;
  /** Update a bet's status (resolve-bets.ts decides won/lost). */
  resolveBet: (betId: string, status: BetStatus) => void;
  removeBetsForProfile: (profileId: string) => void;
  reset: () => void;
}

const initialState: PersistedBets = { bets: [] };

export const useBetStore = create<BetState>()(
  persist(
    (set) => ({
      ...initialState,
      placeBet: (bet) =>
        set((s) => ({
          bets: [...s.bets.filter((b) => b.id !== bet.id), bet],
        })),
      resolveBet: (betId, status) =>
        set((s) => ({
          bets: s.bets.map((b) => (b.id === betId ? { ...b, status } : b)),
        })),
      removeBetsForProfile: (profileId) =>
        set((s) => ({
          bets: s.bets.filter((b) => b.profileId !== profileId),
        })),
      reset: () => set(initialState),
    }),
    validatedPersist<BetState, PersistedBets>({
      name: 'bets',
      version: 1,
      schema: PersistedBetsSchema,
      partialize: ({ bets }) => ({ bets }),
    }),
  ),
);

export const activeBetForProfile = (bets: HealthBet[], profileId: string): HealthBet | undefined =>
  bets.find((b) => b.profileId === profileId && b.status === 'active');

export const betsForProfile = (bets: HealthBet[], profileId: string): HealthBet[] =>
  bets.filter((b) => b.profileId === profileId);
