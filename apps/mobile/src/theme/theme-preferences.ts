import { createContext, useContext } from 'react';

import type { ColorScheme } from './tokens';

export type DarkModePreference = 'system' | ColorScheme;

export interface ThemePreferences {
  seniorMode: boolean;
  darkMode: DarkModePreference;
}

export interface ThemePreferencesContextValue extends ThemePreferences {
  setSeniorMode: (value: boolean) => void;
  setDarkMode: (value: DarkModePreference) => void;
}

export const defaultThemePreferences: ThemePreferences = { seniorMode: false, darkMode: 'system' };

// Temporary home for the preferences until WS3's settings store lands — then ThemeProvider
// reads from the store and this context stays the single seam components depend on.
export const ThemePreferencesContext = createContext<ThemePreferencesContextValue | null>(null);

/** Read/write senior + dark mode preferences (e.g. from the settings screen). */
export function useThemePreferences(): ThemePreferencesContextValue {
  const ctx = useContext(ThemePreferencesContext);
  if (!ctx) throw new Error('useThemePreferences must be used inside <ThemeProvider>');
  return ctx;
}

export function resolveScheme(
  preference: DarkModePreference,
  // RN's ColorSchemeName also includes 'unspecified' — treat anything but 'dark' as light.
  system: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
