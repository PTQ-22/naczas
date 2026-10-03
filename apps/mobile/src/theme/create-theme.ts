import {
  borderWidth,
  colors,
  motion,
  radius,
  seniorColorOverrides,
  space,
  typography,
  layout,
  type ColorScheme,
  type ColorTokens,
  type LayoutTokens,
  type TypeStyle,
  type TypeVariant,
} from './tokens';

export interface Theme {
  scheme: ColorScheme;
  seniorMode: boolean;
  colors: ColorTokens;
  type: Record<TypeVariant, TypeStyle>;
  layout: LayoutTokens;
  space: typeof space;
  radius: typeof radius;
  borderWidth: typeof borderWidth;
  motion: typeof motion;
}

export interface ThemeOptions {
  scheme: ColorScheme;
  seniorMode: boolean;
}

/** Pure: resolves tokens for a given scheme + senior mode. Components read only from this. */
export function createTheme({ scheme, seniorMode }: ThemeOptions): Theme {
  const mode = seniorMode ? 'senior' : 'normal';
  return {
    scheme,
    seniorMode,
    colors: seniorMode ? { ...colors[scheme], ...seniorColorOverrides[scheme] } : colors[scheme],
    type: typography[mode],
    layout: layout[mode],
    space,
    radius,
    borderWidth,
    motion,
  };
}
