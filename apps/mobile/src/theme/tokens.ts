// Source of truth for values: docs/design/tokens.md (WS5). Change hexes there first —
// contrast tests in __tests__/tokens.test.ts mirror the pairs verified in §3.
import type { Urgency } from '@naczas/shared';

export type ColorScheme = 'light' | 'dark';

export interface UrgencyColor {
  /** Text and icon (chip, label). >= 4.5:1 on its bg, surface and screen bg. */
  fg: string;
  /** Soft chip / info-box background. */
  bg: string;
  /** Non-text: card stripe, timeline dot, map marker. >= 3:1. */
  accent: string;
}

export interface ColorTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  focus: string;
  danger: string;
  urgency: Record<Urgency, UrgencyColor>;
}

export const colors: Record<ColorScheme, ColorTokens> = {
  light: {
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    surfaceAlt: '#F2EDE5',
    border: '#E3DCD1',
    borderStrong: '#857B6F',
    text: '#1E2A2D',
    textMuted: '#4E5A5E',
    textSubtle: '#5F686B',
    primary: '#1C6B66',
    primaryPressed: '#155450',
    onPrimary: '#FFFFFF',
    primarySoft: '#DCEDEA',
    focus: '#1C6B66',
    danger: '#B3261E',
    urgency: {
      act_now: { fg: '#A12F1B', bg: '#FBE8E2', accent: '#C2412A' },
      this_year: { fg: '#7A4B00', bg: '#FCEFD6', accent: '#A86B12' },
      later: { fg: '#4A5560', bg: '#ECEFF2', accent: '#78838E' },
      done: { fg: '#276338', bg: '#E2F1E6', accent: '#3B8752' },
      booked: { fg: '#2F4C95', bg: '#E5EBFA', accent: '#4D69B5' },
    },
  },
  dark: {
    bg: '#111615',
    surface: '#1A2120',
    surfaceAlt: '#232B2A',
    border: '#33403D',
    borderStrong: '#7F8C89',
    text: '#EDF1EF',
    textMuted: '#B3BDBA',
    textSubtle: '#949F9C',
    primary: '#62C4B9',
    primaryPressed: '#7FD3C9',
    onPrimary: '#0B1E1C',
    primarySoft: '#1D3532',
    focus: '#62C4B9',
    danger: '#FF8A80',
    urgency: {
      act_now: { fg: '#FF9F88', bg: '#3A1F19', accent: '#EE7A5E' },
      this_year: { fg: '#F2C063', bg: '#35290F', accent: '#D4A03D' },
      later: { fg: '#B9C3CB', bg: '#252B30', accent: '#8B97A2' },
      done: { fg: '#8FD3A2', bg: '#17301F', accent: '#5DB476' },
      booked: { fg: '#A9BCF4', bg: '#1C2541', accent: '#7F9BE5' },
    },
  },
};

// Senior mode raises secondary-text contrast to AAA (>= 7:1); everything else is shared.
export const seniorColorOverrides: Record<
  ColorScheme,
  Pick<ColorTokens, 'textMuted' | 'textSubtle' | 'borderStrong'>
> = {
  light: { textMuted: '#3B4649', textSubtle: '#3B4649', borderStrong: '#6E655B' },
  dark: { textMuted: '#CDD5D2', textSubtle: '#CDD5D2', borderStrong: '#98A4A1' },
};

export const space = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

export const borderWidth = { hairline: 1, strong: 2, focus: 3, accent: 4 } as const;

// stagger: delay between consecutive timeline cards entering (screens.md §2).
export const motion = { fast: 150, base: 300, reduced: 0, stagger: 40 } as const;

/** Light-mode card shadow. Dark mode has no shadow — surface vs bg + border separate cards. */
export const cardElevation = {
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

export type TypeVariant =
  'display' | 'title' | 'heading' | 'bodyLarge' | 'body' | 'label' | 'caption';

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '600' | '700';
}

const baseType: Record<TypeVariant, TypeStyle> = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  bodyLarge: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
};

export const SENIOR_SCALE = 1.3;

// Senior scale is derived, not hand-written, so the two scales can never drift apart.
const scaleType = (scale: number): Record<TypeVariant, TypeStyle> =>
  Object.fromEntries(
    Object.entries(baseType).map(([variant, style]) => [
      variant,
      {
        ...style,
        fontSize: Math.round(style.fontSize * scale),
        lineHeight: Math.round(style.lineHeight * scale),
      },
    ]),
  ) as Record<TypeVariant, TypeStyle>;

export const typography = { normal: baseType, senior: scaleType(SENIOR_SCALE) } as const;

export interface LayoutTokens {
  screenPaddingX: number;
  cardPadding: number;
  cardGap: number;
  sectionGap: number;
  minTouch: number;
  optionTileMinHeight: number;
  maxContentWidth: number;
  icon: { sm: number; md: number; lg: number };
}

export const layout: Record<'normal' | 'senior', LayoutTokens> = {
  normal: {
    screenPaddingX: 16,
    cardPadding: 16,
    cardGap: 12,
    sectionGap: 24,
    minTouch: 44,
    optionTileMinHeight: 56,
    maxContentWidth: 640,
    icon: { sm: 16, md: 20, lg: 24 },
  },
  senior: {
    screenPaddingX: 20,
    cardPadding: 20,
    cardGap: 16,
    sectionGap: 32,
    minTouch: 56,
    optionTileMinHeight: 72,
    maxContentWidth: 640,
    icon: { sm: 20, md: 26, lg: 32 },
  },
};

/** Map marker colour buckets by NFZ wait time — UI categorisation only, not medical advice. */
export const waitBuckets = { shortMaxDays: 14, mediumMaxDays: 60 } as const;

export type WaitBucket = 'short' | 'medium' | 'long' | 'unknown';

/** Wait buckets reuse urgency accents (tokens.md §2.4) so the map stays in the same palette. */
export const waitBucketUrgency: Record<WaitBucket, Urgency> = {
  short: 'done',
  medium: 'this_year',
  long: 'act_now',
  unknown: 'later',
};

export function waitBucket(waitDays: number | null): WaitBucket {
  if (waitDays === null) return 'unknown';
  if (waitDays <= waitBuckets.shortMaxDays) return 'short';
  if (waitDays <= waitBuckets.mediumMaxDays) return 'medium';
  return 'long';
}
