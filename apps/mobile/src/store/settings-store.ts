import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ISODateSchema, type ISODate } from '@naczas/shared';

import type { DarkModePreference } from '@/theme';

import { validatedPersist } from './persist';

const PersistedSettingsSchema = z.object({
  seniorMode: z.boolean(),
  darkMode: z.enum(['system', 'light', 'dark']) satisfies z.ZodType<DarkModePreference>,
  /** Demo "time travel" — when set, the whole app treats this as today. */
  todayOverride: ISODateSchema.nullable(),
});
type PersistedSettings = z.infer<typeof PersistedSettingsSchema>;

interface SettingsState extends PersistedSettings {
  setSeniorMode: (value: boolean) => void;
  setDarkMode: (value: DarkModePreference) => void;
  setTodayOverride: (value: ISODate | null) => void;
  reset: () => void;
}

const initialState: PersistedSettings = {
  seniorMode: false,
  darkMode: 'system',
  todayOverride: null,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setSeniorMode: (seniorMode) => set({ seniorMode }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setTodayOverride: (todayOverride) => set({ todayOverride }),
      reset: () => set(initialState),
    }),
    validatedPersist<SettingsState, PersistedSettings>({
      name: 'settings',
      version: 1,
      schema: PersistedSettingsSchema,
      partialize: ({ seniorMode, darkMode, todayOverride }) => ({
        seniorMode,
        darkMode,
        todayOverride,
      }),
    }),
  ),
);
