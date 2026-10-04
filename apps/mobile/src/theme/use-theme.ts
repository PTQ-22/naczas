import { useContext, useMemo } from 'react';

import { createTheme, type Theme } from './create-theme';
import { defaultThemePreferences, ThemePreferencesContext } from './theme-preferences';

/**
 * Resolved theme for the current senior-mode preference.
 * Works without <ThemeProvider> (falls back to defaults) so isolated component tests and
 * not-yet-wrapped screens still render.
 */
export function useTheme(): Theme {
  const { seniorMode } = useContext(ThemePreferencesContext) ?? defaultThemePreferences;
  return useMemo(() => createTheme({ seniorMode }), [seniorMode]);
}
