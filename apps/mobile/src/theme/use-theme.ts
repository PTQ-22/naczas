import { useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { createTheme, type Theme } from './create-theme';
import { usePaletteStore } from './palette-store';
import {
  defaultThemePreferences,
  resolveScheme,
  ThemePreferencesContext,
} from './theme-preferences';

/**
 * Resolved theme for the current senior/dark preferences.
 * Works without <ThemeProvider> (falls back to defaults + system scheme) so isolated
 * component tests and not-yet-wrapped screens still render.
 */
export function useTheme(): Theme {
  const prefs = useContext(ThemePreferencesContext) ?? defaultThemePreferences;
  const system = useColorScheme();
  const scheme = resolveScheme(prefs.darkMode, system);
  const { seniorMode } = prefs;
  const palette = usePaletteStore((s) => s.palette);
  return useMemo(() => createTheme({ scheme, seniorMode, palette }), [scheme, seniorMode, palette]);
}
