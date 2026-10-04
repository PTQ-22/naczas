import { createContext, useContext } from 'react';

export interface ThemePreferences {
  seniorMode: boolean;
}

export interface ThemePreferencesContextValue extends ThemePreferences {
  setSeniorMode: (value: boolean) => void;
}

export const defaultThemePreferences: ThemePreferences = { seniorMode: false };

// Temporary home for the preferences until WS3's settings store lands — then ThemeProvider
// reads from the store and this context stays the single seam components depend on.
export const ThemePreferencesContext = createContext<ThemePreferencesContextValue | null>(null);

/** Read/write the senior mode preference (e.g. from the settings screen). */
export function useThemePreferences(): ThemePreferencesContextValue {
  const ctx = useContext(ThemePreferencesContext);
  if (!ctx) throw new Error('useThemePreferences must be used inside <ThemeProvider>');
  return ctx;
}
