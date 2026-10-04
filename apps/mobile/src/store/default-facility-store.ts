import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Facility } from '@naczas/shared';

import { validatedPersist } from './persist';

/**
 * The user's own clinic, picked once and used everywhere facilities are listed. Stored only on
 * the device (AGENTS.md §8). NFZ queue ids differ per service, so the clinic is matched by
 * provider + address instead — the same building shows up for the dentist and the eye doctor.
 */
const DefaultFacilitySchema = z.object({
  key: z.string().min(1),
  providerName: z.string(),
  address: z.string(),
  locality: z.string(),
  phone: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
});
export type DefaultFacility = z.infer<typeof DefaultFacilitySchema>;

const PersistedSchema = z.object({
  facilities: z
    .record(z.string(), DefaultFacilitySchema)
    .default({} as Record<string, DefaultFacility>),
});
type Persisted = z.infer<typeof PersistedSchema>;

interface DefaultFacilityState extends Persisted {
  setDefault: (profileId: string, facility: Facility) => void;
  clear: (profileId: string) => void;
  reset: () => void;
}

const normalize = (s: string) => s.trim().toLocaleLowerCase('pl').replace(/\s+/g, ' ');

/** Provider-level identity of a facility: same clinic across NFZ services. */
export function facilityKey(f: Pick<Facility, 'providerName' | 'address' | 'locality'>): string {
  return [f.providerName, f.address, f.locality].map(normalize).join('|');
}

/** Pure: moves the default clinic's entries to the top, keeping the order otherwise. */
export function pinDefaultFirst<T extends Facility>(items: readonly T[], key: string | null): T[] {
  if (!key) return [...items];
  const mine = items.filter((f) => facilityKey(f) === key);
  return mine.length ? [...mine, ...items.filter((f) => facilityKey(f) !== key)] : [...items];
}

export const useDefaultFacilityStore = create<DefaultFacilityState>()(
  persist(
    (set) => ({
      facilities: {},
      setDefault: (profileId, f) =>
        set((state) => ({
          facilities: {
            ...state.facilities,
            [profileId]: {
              key: facilityKey(f),
              providerName: f.providerName,
              address: f.address,
              locality: f.locality,
              phone: f.phone,
              lat: f.lat,
              lng: f.lng,
            },
          },
        })),
      clear: (profileId) =>
        set((state) => {
          const next = { ...state.facilities };
          delete next[profileId];
          return { facilities: next };
        }),
      reset: () => set({ facilities: {} }),
    }),
    validatedPersist<DefaultFacilityState, Persisted>({
      name: 'default-facility',
      // Bump version because schema shape changed (was { facility: ... }, now { facilities: ... })
      version: 2,
      schema: PersistedSchema,
      partialize: ({ facilities }) => ({ facilities }),
      migrations: {
        1: (_state: unknown) => ({
          // Can't automatically guess which profile it belonged to, so drop old single facility
          facilities: {},
        }),
      },
    }),
  ),
);
