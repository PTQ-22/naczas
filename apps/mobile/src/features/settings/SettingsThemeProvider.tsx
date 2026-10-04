import { useMemo, type ReactNode } from 'react';

import { useSettingsStore } from '@/store';
import {
  ThemePreferencesContext,
  type ThemePreferencesContextValue,
} from '@/theme/theme-preferences';

/**
 * Feeds WS4's theme context from the persisted settings store, so senior mode survives
 * restarts. Replaces `<ThemeProvider>` (local state) at the app root; `useTheme()` is unchanged.
 */
export function SettingsThemeProvider({ children }: { children: ReactNode }) {
  const seniorMode = useSettingsStore((s) => s.seniorMode);
  const setSeniorMode = useSettingsStore((s) => s.setSeniorMode);

  const value = useMemo<ThemePreferencesContextValue>(
    () => ({ seniorMode, setSeniorMode }),
    [seniorMode, setSeniorMode],
  );

  return (
    <ThemePreferencesContext.Provider value={value}>{children}</ThemePreferencesContext.Provider>
  );
}
