import {
  borderWidth,
  colors,
  layout,
  motion,
  radius,
  seniorColorOverrides,
  space,
  typography,
  type ColorTokens,
  type LayoutTokens,
  type TypeStyle,
  type TypeVariant,
} from './tokens';

export interface Theme {
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
  seniorMode: boolean;
}

/** Pure: resolves tokens for senior or normal mode. Components read only from this. */
export function createTheme({ seniorMode }: ThemeOptions): Theme {
  const mode = seniorMode ? 'senior' : 'normal';
  return {
    seniorMode,
    colors: seniorMode ? { ...colors, ...seniorColorOverrides } : colors,
    type: typography[mode],
    layout: layout[mode],
    space,
    radius,
    borderWidth,
    motion,
  };
}
