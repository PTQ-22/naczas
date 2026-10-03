import { useMemo, useState, type ReactNode } from 'react';

import {
  defaultThemePreferences,
  ThemePreferencesContext,
  type ThemePreferences,
  type ThemePreferencesContextValue,
} from './theme-preferences';

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial preferences — mainly for tests and the component gallery. */
  initial?: Partial<ThemePreferences>;
}

/** Holds senior/dark mode preferences (local state until WS3's store replaces it). */
export function ThemeProvider({ children, initial }: ThemeProviderProps) {
  const [seniorMode, setSeniorMode] = useState(
    initial?.seniorMode ?? defaultThemePreferences.seniorMode,
  );
  const [darkMode, setDarkMode] = useState(initial?.darkMode ?? defaultThemePreferences.darkMode);

  const value = useMemo<ThemePreferencesContextValue>(
    () => ({ seniorMode, darkMode, setSeniorMode, setDarkMode }),
    [seniorMode, darkMode],
  );

  return (
    <ThemePreferencesContext.Provider value={value}>{children}</ThemePreferencesContext.Provider>
  );
}
