import { act, renderHook } from '@testing-library/react-native';
import * as RN from 'react-native';

import { resolveScheme, useThemePreferences } from '../theme-preferences';
import { ThemeProvider } from '../ThemeProvider';
import { colors, seniorColorOverrides } from '../tokens';
import { useTheme } from '../use-theme';

import type { ReactNode } from 'react';

describe('resolveScheme', () => {
  it('follows the system when preference is "system"', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', null)).toBe('light');
  });

  it('explicit preference wins over the system', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });
});

describe('useTheme', () => {
  afterEach(() => jest.restoreAllMocks());

  it('works without a provider (defaults + system scheme)', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('dark');
    expect(result.current.seniorMode).toBe(false);
    expect(result.current.colors.bg).toBe(colors.dark.bg);
  });

  it('reacts to preference changes from the provider', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );
    const { result } = renderHook(() => ({ theme: useTheme(), prefs: useThemePreferences() }), {
      wrapper,
    });
    expect(result.current.theme.scheme).toBe('light');

    act(() => {
      result.current.prefs.setDarkMode('dark');
      result.current.prefs.setSeniorMode(true);
    });

    expect(result.current.theme.scheme).toBe('dark');
    expect(result.current.theme.colors.textMuted).toBe(seniorColorOverrides.dark.textMuted);
    expect(result.current.theme.type.body.fontSize).toBe(21);
  });

  it('useThemePreferences throws outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useThemePreferences())).toThrow(/ThemeProvider/);
  });
});
