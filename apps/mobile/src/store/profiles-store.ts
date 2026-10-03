import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ProfileSchema, type Profile } from '@naczas/shared';

import { validatedPersist } from './persist';
import { migrateProfilesV1 } from './survey-v2-migration';

const PersistedProfilesSchema = z.object({
  profiles: z.array(ProfileSchema),
  activeProfileId: z.string().nullable(),
});
type PersistedProfiles = z.infer<typeof PersistedProfilesSchema>;

interface ProfilesState extends PersistedProfiles {
  /** Adds the profile; the first one added becomes active. */
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) => void;
  /** Removes the profile only — use `deleteProfileWithData` to also drop its exam records. */
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  reset: () => void;
}

const initialState: PersistedProfiles = { profiles: [], activeProfileId: null };

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set) => ({
      ...initialState,
      addProfile: (profile) =>
        set((s) => ({
          profiles: [...s.profiles.filter((p) => p.id !== profile.id), profile],
          activeProfileId: s.activeProfileId ?? profile.id,
        })),
      updateProfile: (id, patch) =>
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removeProfile: (id) =>
        set((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id);
          const activeProfileId =
            s.activeProfileId === id ? (profiles[0]?.id ?? null) : s.activeProfileId;
          return { profiles, activeProfileId };
        }),
      setActiveProfile: (id) =>
        set((s) => (s.profiles.some((p) => p.id === id) ? { activeProfileId: id } : s)),
      reset: () => set(initialState),
    }),
    validatedPersist<ProfilesState, PersistedProfiles>({
      name: 'profiles',
      version: 2,
      migrations: { 1: migrateProfilesV1 },
      schema: PersistedProfilesSchema,
      partialize: ({ profiles, activeProfileId }) => ({ profiles, activeProfileId }),
    }),
  ),
);

export const selectActiveProfile = (s: ProfilesState): Profile | undefined =>
  s.profiles.find((p) => p.id === s.activeProfileId);
