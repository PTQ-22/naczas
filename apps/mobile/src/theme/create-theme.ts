import {
  borderWidth,
  DEFAULT_PALETTE,
  motion,
  palettes,
  radius,
  seniorColorOverrides,
  space,
  typography,
  layout,
  type ColorScheme,
  type ColorTokens,
  type LayoutTokens,
  type PaletteId,
  type TypeStyle,
  type TypeVariant,
} from './tokens';

export interface Theme {
  scheme: ColorScheme;
  seniorMode: boolean;
  palette: PaletteId;
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
  palette?: PaletteId;
}

/** Pure: resolves tokens for a given scheme + senior mode. Components read only from this. */
export function createTheme({
  scheme,
  seniorMode,
  palette = DEFAULT_PALETTE,
}: ThemeOptions): Theme {
  const mode = seniorMode ? 'senior' : 'normal';
  const base = palettes[palette][scheme];
  return {
    scheme,
    seniorMode,
    palette,
    colors: seniorMode ? { ...base, ...seniorColorOverrides[scheme] } : base,
    type: typography[mode],
    layout: layout[mode],
    space,
    radius,
    borderWidth,
    motion,
  };
}
