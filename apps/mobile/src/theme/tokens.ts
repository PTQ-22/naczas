// Redesign v2: docs/design/redesign.md — light blue + red accents, light theme only.
// Contrast pairs are verified in __tests__/tokens.test.ts — a hex change that breaks AA fails
// `pnpm check`.
import type { Urgency } from '@naczas/shared';

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
  /** Cobalt — buttons, links, focus. */
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
  /** Urgent count on the wall / inactive folder tabs — act_now.fg is too dark on light cobalt. */
  urgentOnWall: string;
  /** Big date on the agent's "Umówiono" ticket — a celebratory light green; large text only (≥ 3:1). */
  bookedTicket: string;
  urgency: Record<Urgency, UrgencyColor>;
}

// Clinical sky blue: white plates on a pale blue wall, blue buttons, red only where something is
// urgent (marker, act_now). Contrast pairs are guarded in __tests__/tokens.test.ts.

const lightBase = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#DCE4EE',
  borderStrong: '#6B7686',
  text: '#0E1B2C',
  textMuted: '#4A5568',
  textSubtle: '#4A5568',
  onPrimary: '#FFFFFF',
  danger: '#C62828',
  onWall: '#0E1B2C',
  urgentOnWall: '#A11B1B',
  bookedTicket: '#22A35A',
} as const;

const lightUrgency = (neutralBg: string): ColorTokens['urgency'] => ({
  act_now: { fg: '#B3261E', bg: '#FDE4E1', accent: '#D32F2F' },
  this_year: { fg: '#0E1B2C', bg: neutralBg, accent: '#6B7686' },
  later: { fg: '#4A5568', bg: neutralBg, accent: '#6B7686' },
  done: { fg: '#17693F', bg: '#DDEEE2', accent: '#1F7A4C' },
  // Traffic light: Teraz red → Umówione amber → Zrobione green.
  booked: { fg: '#7A4E00', bg: '#F7E9C6', accent: '#B07800' },
});

export const colors: ColorTokens = {
  ...lightBase,
  surfaceAlt: '#EDF5FC',
  primary: '#1565C0',
  primaryPressed: '#0D4F9E',
  primarySoft: '#E3F0FC',
  focus: '#1565C0',
  marker: '#FFD6D2',
  wall: '#DDEFFC',
  wallGrout: '#C6E3F8',
  urgency: lightUrgency('#EDF5FC'),
};

// Senior mode raises secondary-text contrast to AAA (>= 7:1); everything else is shared.
export const seniorColorOverrides: Pick<ColorTokens, 'textMuted' | 'textSubtle' | 'borderStrong'> =
  { textMuted: '#2F3A4A', textSubtle: '#2F3A4A', borderStrong: '#4A5568' };

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
  sm: 10,
  md: 14,
  // Rounder, continuous corners read as native on iOS; the earlier 10 pt felt boxy.
  plate: 22,
  tab: 14,
  sheet: 22,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const borderWidth = {
  hairline: 1,
  strong: 1.5,
  plate: 2,
  marker: 3,
  focus: 3,
  accent: 4,
} as const;

// stagger kept for list entering; the only signature animation is the ticket slide-in.
export const motion = { fast: 150, base: 300, reduced: 0, stagger: 40, plate: 420 } as const;

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
  // Uppercase mono section labels and status words only — never names or sentences. 14 pt is the
  // app-wide minimum (tokens.md §4).
  eyebrow: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    lineHeight: 20,
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
