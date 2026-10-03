// Source of truth: docs/design/redesign.md §3 (redesign v2 „Numerek”). Contrast pairs are
// verified in __tests__/tokens.test.ts — a hex change that breaks AA fails `pnpm check`.
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
  /** „Ściana” — screen background. */
  bg: string;
  /** „Papier” — ticket and sheets. */
  surface: string;
  /** Pressed rows, inset areas. */
  surfaceAlt: string;
  /** Hairline separators between list rows. */
  border: string;
  /** Radio rings, input outlines — >= 3:1. */
  borderStrong: string;
  /** „Atrament” — primary text. */
  text: string;
  textMuted: string;
  textSubtle: string;
  /** „Pieczątka” — buttons, links, focus. */
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  focus: string;
  danger: string;
  /**
   * „Zakreślacz” — highlighter behind an urgent date/number, never text colour. Light: fill
   * behind ink text; dark: 3 px underline only (a yellow block glares on navy).
   */
  marker: string;
  urgency: Record<Urgency, UrgencyColor>;
}

// Redesign v2 „Numerek” (docs/design/redesign.md §3): clinic wall + stamp ink. Contrast pairs are
// guarded in __tests__/tokens.test.ts.
export const colors: Record<ColorScheme, ColorTokens> = {
  light: {
    bg: '#E9EEF2',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F5F8',
    border: '#CDD5DE',
    borderStrong: '#66768A',
    text: '#0E1B2C',
    textMuted: '#4A5A6E',
    textSubtle: '#4A5A6E',
    primary: '#1F3FD1',
    primaryPressed: '#1832A8',
    onPrimary: '#FFFFFF',
    primarySoft: '#DFE5FB',
    focus: '#1F3FD1',
    danger: '#B4231A',
    marker: '#FFE24A',
    urgency: {
      act_now: { fg: '#B4231A', bg: '#FBE3E0', accent: '#E0352B' },
      this_year: { fg: '#0E1B2C', bg: '#FFF4BF', accent: '#66768A' },
      later: { fg: '#4A5A6E', bg: '#E1E7ED', accent: '#66768A' },
      done: { fg: '#17734A', bg: '#DCF1E5', accent: '#1F8A5A' },
      booked: { fg: '#1F3FD1', bg: '#DFE5FB', accent: '#1F3FD1' },
    },
  },
  dark: {
    bg: '#0B1320',
    surface: '#131D2C',
    surfaceAlt: '#1B2739',
    border: '#27354A',
    borderStrong: '#71839C',
    text: '#E8EEF5',
    textMuted: '#AAB7C8',
    textSubtle: '#AAB7C8',
    primary: '#8EA2FF',
    primaryPressed: '#A9B8FF',
    onPrimary: '#0B1320',
    primarySoft: '#1D2853',
    focus: '#8EA2FF',
    danger: '#FF8A80',
    marker: '#FFE24A',
    urgency: {
      act_now: { fg: '#FF8F85', bg: '#3A1A1C', accent: '#F0564B' },
      this_year: { fg: '#E8EEF5', bg: '#2E2A14', accent: '#71839C' },
      later: { fg: '#AAB7C8', bg: '#1B2739', accent: '#71839C' },
      done: { fg: '#6FD39E', bg: '#12301F', accent: '#3DB27A' },
      booked: { fg: '#A9B8FF', bg: '#1D2853', accent: '#8EA2FF' },
    },
  },
};

// Senior mode raises secondary-text contrast to AAA (>= 7:1); everything else is shared.
export const seniorColorOverrides: Record<
  ColorScheme,
  Pick<ColorTokens, 'textMuted' | 'textSubtle' | 'borderStrong'>
> = {
  light: { textMuted: '#33435A', textSubtle: '#33435A', borderStrong: '#4A5A6E' },
  dark: { textMuted: '#C9D4E2', textSubtle: '#C9D4E2', borderStrong: '#8C9DB4' },
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

// sheet: 14 continuous (redesign §3); ticket: 6 + perforation notches.
export const radius = { sm: 8, md: 12, sheet: 14, ticket: 6, lg: 16, xl: 24, full: 999 } as const;

export const borderWidth = { hairline: 1, strong: 2, marker: 3, focus: 3, accent: 4 } as const;

// stagger kept for list entering; the only signature animation is the ticket slide-in.
export const motion = { fast: 150, base: 300, reduced: 0, stagger: 40, ticket: 420 } as const;

/**
 * The single shadow on any screen — reserved for the queue ticket (redesign §3, §7).
 * Dark mode: no shadow, the ticket separates by surface vs bg.
 */
export const ticketShadow: Record<ColorScheme, string | undefined> = {
  light: '0 1px 0 rgba(14,27,44,0.06), 0 8px 24px -12px rgba(14,27,44,0.18)',
  dark: undefined,
};

/**
 * Font family names as registered by `useAppFonts` (keys of `fontAssets`). One family per weight:
 * custom fonts must not combine with `fontWeight`, or Android/iOS fall back to the system face.
 */
export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'AtkinsonHyperlegibleNext_400Regular',
  bodyBold: 'AtkinsonHyperlegibleNext_700Bold',
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_600SemiBold',
} as const;

export type TypeVariant =
  | 'ticket'
  | 'display'
  | 'title'
  | 'heading'
  | 'bodyLarge'
  | 'body'
  | 'label'
  | 'caption'
  | 'eyebrow'
  | 'data';

export interface TypeStyle {
  fontFamily: (typeof fonts)[keyof typeof fonts];
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
}

// Three roles (redesign §3): Bricolage = display, Atkinson Hyperlegible = body (designed for low
// vision — the senior-mode argument), Plex Mono = every number/date/code (thermal-printer ticket).
const baseType: Record<TypeVariant, TypeStyle> = {
  ticket: { fontFamily: fonts.monoBold, fontSize: 96, lineHeight: 100, letterSpacing: -4 },
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.displayBold, fontSize: 19, lineHeight: 24 },
  bodyLarge: { fontFamily: fonts.body, fontSize: 19, lineHeight: 28 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25 },
  label: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22 },
  caption: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  // Uppercase mono section labels; 13 pt is legible because caps + tracking (redesign §3).
  eyebrow: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  data: { fontFamily: fonts.mono, fontSize: 17, lineHeight: 24 },
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
        ...(style.letterSpacing !== undefined && {
          letterSpacing: Math.round(style.letterSpacing * scale * 10) / 10,
        }),
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
