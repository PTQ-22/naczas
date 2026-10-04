import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ISODateSchema, type ISODate } from '@naczas/shared';

import type { DarkModePreference } from '@/theme';

import { validatedPersist } from './persist';

/**
 * Personal data the "Zadzwoń za mnie" agent may say when the clinic asks for it. Off by default:
 * each field needs the user's explicit opt-in before any call (GDPR consent must be granular).
 */
const CallDisclosureSchema = z.object({
  firstName: z.boolean(),
  lastName: z.boolean(),
  pesel: z.boolean(),
  birthDate: z.boolean(),
  phone: z.boolean(),
  address: z.boolean(),
});
export type CallDisclosure = z.infer<typeof CallDisclosureSchema>;
export type DisclosureField = keyof CallDisclosure;
export const DISCLOSURE_FIELDS = CallDisclosureSchema.keyof().options;

const NO_DISCLOSURE: CallDisclosure = {
  firstName: false,
  lastName: false,
  pesel: false,
  birthDate: false,
  phone: false,
  address: false,
};

const PersistedSettingsSchema = z.object({
  seniorMode: z.boolean(),
  darkMode: z.enum(['system', 'light', 'dark']) satisfies z.ZodType<DarkModePreference>,
  /** Demo "time travel" — when set, the whole app treats this as today. */
  todayOverride: ISODateSchema.nullable().default(null),
  familyCode: z.string().nullable().default(null),
  // Default instead of a version bump: settings saved before this field restore with all off.
  callDisclosure: CallDisclosureSchema.default(NO_DISCLOSURE),
});
type PersistedSettings = z.infer<typeof PersistedSettingsSchema>;

interface SettingsState extends PersistedSettings {
  setSeniorMode: (value: boolean) => void;
  setDarkMode: (value: DarkModePreference) => void;
  setTodayOverride: (value: ISODate | null) => void;
  setFamilyCode: (value: string | null) => void;
  setCallDisclosure: (field: DisclosureField, allowed: boolean) => void;
  reset: () => void;
}

const initialState: PersistedSettings = {
  seniorMode: false,
  darkMode: 'system',
  todayOverride: null,
  familyCode: null,
  callDisclosure: NO_DISCLOSURE,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setSeniorMode: (seniorMode) => set({ seniorMode }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setTodayOverride: (todayOverride) => set({ todayOverride }),
      setFamilyCode: (familyCode) => set({ familyCode }),
      setCallDisclosure: (field, allowed) =>
        set((s) => ({ callDisclosure: { ...s.callDisclosure, [field]: allowed } })),
      reset: () => set(initialState),
    }),
    validatedPersist<SettingsState, PersistedSettings>({
      name: 'settings',
      version: 1,
      schema: PersistedSettingsSchema,
      partialize: ({ seniorMode, darkMode, todayOverride, familyCode, callDisclosure }) => ({
        seniorMode,
        darkMode,
        todayOverride,
        familyCode,
        callDisclosure,
      }),
    }),
  ),
);
