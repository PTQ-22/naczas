// Redesign v2: docs/design/redesign.md, palette switched to cobalt tiles + enamel plates by team
// pick. Contrast pairs are verified in __tests__/tokens.test.ts — a hex change that breaks AA
// fails `pnpm check`.
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
  /** Screen background where there is no tile wall — the enamel plate's cream. */
  bg: string;
  /** Enamel plate / sheet. */
  surface: string;
  /** Pressed rows, inactive folder tabs on a plate. */
  surfaceAlt: string;
  /** Hairline separators between list rows. */
  border: string;
  /** Radio rings, input outlines — >= 3:1. */
  borderStrong: string;
  /** Ink — primary text and the plate's 3 px frame. */
  text: string;
  textMuted: string;
  textSubtle: string;
  /** Cobalt — buttons, links, focus, "booked". */
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  focus: string;
  danger: string;
  /** Highlighter behind an urgent number — never text colour. */
  marker: string;
  /** Tile wall behind the plates (plan, onboarding). */
  wall: string;
  /** Grout lines between tiles — decorative. */
  wallGrout: string;
  /** Text placed straight on the wall. */
  onWall: string;
  urgency: Record<Urgency, UrgencyColor>;
}

// Redesign v2 — cobalt hospital tiles + cream enamel plates (direction picked by the team over
// docs/design/redesign.md §3). Contrast pairs are guarded in __tests__/tokens.test.ts.
export const colors: Record<ColorScheme, ColorTokens> = {
  light: {
    bg: '#F6F3EA',
    surface: '#FBF9F3',
    surfaceAlt: '#ECE7DB',
    border: '#DDD6C6',
    borderStrong: '#6E6A60',
    text: '#0E1B2C',
    textMuted: '#4A5160',
    textSubtle: '#4A5160',
    primary: '#24477A',
    primaryPressed: '#1C3964',
    onPrimary: '#FFFFFF',
    primarySoft: '#E1E6EF',
    focus: '#24477A',
    danger: '#B4231A',
    marker: '#FFE24A',
    wall: '#24477A',
    wallGrout: '#1C3964',
    onWall: '#FFFFFF',
    urgency: {
      act_now: { fg: '#B4231A', bg: '#F7E0DA', accent: '#C8322A' },
      this_year: { fg: '#0E1B2C', bg: '#ECE7DB', accent: '#6E6A60' },
      later: { fg: '#4A5160', bg: '#ECE7DB', accent: '#6E6A60' },
      done: { fg: '#17693F', bg: '#DDEEE2', accent: '#1F7A4C' },
      booked: { fg: '#24477A', bg: '#E1E6EF', accent: '#24477A' },
    },
  },
  dark: {
    bg: '#0B1628',
    surface: '#152440',
    surfaceAlt: '#1C2D50',
    border: '#2A3B5E',
    borderStrong: '#7A8CAE',
    text: '#E8EEF5',
    textMuted: '#AEBAD0',
    textSubtle: '#AEBAD0',
    primary: '#8EA9FF',
    primaryPressed: '#A9BDFF',
    onPrimary: '#0B1628',
    primarySoft: '#22325C',
    focus: '#8EA9FF',
    danger: '#FF8F85',
    marker: '#FFE24A',
    wall: '#0B1628',
    wallGrout: '#08111F',
    onWall: '#E8EEF5',
    urgency: {
      act_now: { fg: '#FF8F85', bg: '#3A1C24', accent: '#F0564B' },
      this_year: { fg: '#E8EEF5', bg: '#1C2D50', accent: '#7A8CAE' },
      later: { fg: '#AEBAD0', bg: '#1C2D50', accent: '#7A8CAE' },
      done: { fg: '#7FD8A8', bg: '#123227', accent: '#3DB27A' },
      booked: { fg: '#A9BDFF', bg: '#22325C', accent: '#8EA9FF' },
    },
  },
};

// Senior mode raises secondary-text contrast to AAA (>= 7:1); everything else is shared.
export const seniorColorOverrides: Record<
  ColorScheme,
  Pick<ColorTokens, 'textMuted' | 'textSubtle' | 'borderStrong'>
> = {
  light: { textMuted: '#323846', textSubtle: '#323846', borderStrong: '#4A5160' },
  dark: { textMuted: '#CDD6E6', textSubtle: '#CDD6E6', borderStrong: '#95A5C4' },
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

// plate: enamel sign corners; tab: folder-tab top corners.
export const radius = {
  sm: 8,
  md: 12,
  plate: 10,
  tab: 8,
  sheet: 14,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const borderWidth = {
  hairline: 1,
  strong: 2,
  plate: 3,
  marker: 3,
  focus: 3,
  accent: 4,
} as const;

// stagger kept for list entering; the only signature animation is the ticket slide-in.
export const motion = { fast: 150, base: 300, reduced: 0, stagger: 40, plate: 420 } as const;

/** Tile size of the wall pattern (cobalt hospital tiles). */
export const tile = { size: 24 } as const;

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
  ticket: { fontFamily: fonts.display, fontSize: 96, lineHeight: 96, letterSpacing: -3 },
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
