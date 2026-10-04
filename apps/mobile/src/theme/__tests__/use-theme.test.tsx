import { act, renderHook } from '@testing-library/react-native';

import { useThemePreferences } from '../theme-preferences';
import { ThemeProvider } from '../ThemeProvider';
import { colors, seniorColorOverrides } from '../tokens';
import { useTheme } from '../use-theme';

import type { ReactNode } from 'react';

describe('useTheme', () => {
  afterEach(() => jest.restoreAllMocks());

  it('works without a provider (light defaults)', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.seniorMode).toBe(false);
    expect(result.current.colors).toBe(colors);
  });

  it('reacts to senior mode changes from the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );
    const { result } = renderHook(() => ({ theme: useTheme(), prefs: useThemePreferences() }), {
      wrapper,
    });

    act(() => result.current.prefs.setSeniorMode(true));

    expect(result.current.theme.colors.textMuted).toBe(seniorColorOverrides.textMuted);
    expect(result.current.theme.type.body.fontSize).toBe(22);
  });

  it('useThemePreferences throws outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useThemePreferences())).toThrow(/ThemeProvider/);
  });
});
