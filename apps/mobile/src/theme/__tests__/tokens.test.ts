import { UrgencySchema } from '@naczas/shared';

import { contrastRatio } from '../contrast';
import { createTheme } from '../create-theme';
import { colors, seniorColorOverrides, typography, waitBucket, type ColorScheme } from '../tokens';

const AA_TEXT = 4.5;
const UI_NON_TEXT = 3;
const AAA_TEXT = 7;
const schemes: ColorScheme[] = ['light', 'dark'];
const urgencies = UrgencySchema.options;

describe('contrastRatio', () => {
  it('matches known WCAG extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#0E1B2C', '#E9EEF2')).toBeCloseTo(contrastRatio('#E9EEF2', '#0E1B2C'), 5);
  });

  it('rejects non-#RRGGBB input', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow();
  });
});

// Mirrors docs/design/tokens.md §3 — a hex change that breaks AA must fail `pnpm check`.
describe.each(schemes)('%s palette contrast', (scheme) => {
  const c = colors[scheme];
  const backgrounds = { bg: c.bg, surface: c.surface, surfaceAlt: c.surfaceAlt };

  it.each(['text', 'textMuted', 'textSubtle', 'primary', 'danger'] as const)(
    '%s is AA on every background',
    (token) => {
      for (const bg of Object.values(backgrounds)) {
        expect(contrastRatio(c[token], bg)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    },
  );

  it('primary pairs are AA', () => {
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.onPrimary, c.primaryPressed)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.primary, c.primarySoft)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.text, c.primarySoft)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('UI elements are >= 3:1', () => {
    expect(contrastRatio(c.borderStrong, c.surface)).toBeGreaterThanOrEqual(UI_NON_TEXT);
    expect(contrastRatio(c.borderStrong, c.bg)).toBeGreaterThanOrEqual(UI_NON_TEXT);
    expect(contrastRatio(c.focus, c.bg)).toBeGreaterThanOrEqual(UI_NON_TEXT);
    expect(contrastRatio(c.primary, c.surface)).toBeGreaterThanOrEqual(UI_NON_TEXT);
  });

  it.each(urgencies)('urgency %s: fg/text AA, accent >= 3:1', (u) => {
    const { fg, bg, accent } = c.urgency[u];
    for (const back of [bg, c.surface, c.bg]) {
      expect(contrastRatio(fg, back)).toBeGreaterThanOrEqual(AA_TEXT);
    }
    expect(contrastRatio(c.text, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(accent, c.surface)).toBeGreaterThanOrEqual(UI_NON_TEXT);
    expect(contrastRatio(accent, c.bg)).toBeGreaterThanOrEqual(UI_NON_TEXT);
  });

  it('text on the tile wall is AA and plates stand out from the wall', () => {
    expect(contrastRatio(c.onWall, c.wall)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.onWall, c.wallGrout)).toBeGreaterThanOrEqual(AA_TEXT);
    // A plate's edge is its fill (light: cream on cobalt) or its 3 px ink frame (dark) — one of
    // the two must be a >= 3:1 UI boundary against the wall.
    const edge = Math.max(contrastRatio(c.surface, c.wall), contrastRatio(c.text, c.wall));
    expect(edge).toBeGreaterThanOrEqual(UI_NON_TEXT);
  });

  it('marker: ink text on the highlighter is AA, the marker itself is visible on bg/surface', () => {
    // Light: marker is a fill behind ink. Dark: a 3 px underline — must read as a mark (>= 3:1).
    if (scheme === 'light') {
      expect(contrastRatio(c.text, c.marker)).toBeGreaterThanOrEqual(AAA_TEXT);
    } else {
      expect(contrastRatio(c.marker, c.surface)).toBeGreaterThanOrEqual(UI_NON_TEXT);
      expect(contrastRatio(c.marker, c.bg)).toBeGreaterThanOrEqual(UI_NON_TEXT);
    }
  });

  it('senior overrides reach AAA for secondary text', () => {
    const s = seniorColorOverrides[scheme];
    for (const bg of Object.values(backgrounds)) {
      expect(contrastRatio(s.textMuted, bg)).toBeGreaterThanOrEqual(AAA_TEXT);
      expect(contrastRatio(s.textSubtle, bg)).toBeGreaterThanOrEqual(AAA_TEXT);
    }
    expect(contrastRatio(s.borderStrong, c.bg)).toBeGreaterThanOrEqual(UI_NON_TEXT);
  });
});

describe('typography', () => {
  it('derives senior scale as normal x 1.3, rounded', () => {
    expect(typography.senior.body.fontSize).toBe(22);
    expect(typography.senior.display).toMatchObject({ fontSize: 42, lineHeight: 47 });
    expect(typography.senior.caption).toMatchObject({ fontSize: 18, lineHeight: 26 });
  });

  it('keeps the font family per role when scaling', () => {
    expect(typography.senior.ticket.fontFamily).toBe(typography.normal.ticket.fontFamily);
    expect(typography.normal.data.fontFamily).toMatch(/^IBMPlexMono/);
    expect(typography.normal.body.fontFamily).toMatch(/^AtkinsonHyperlegibleNext/);
    expect(typography.normal.display.fontFamily).toMatch(/^BricolageGrotesque/);
  });

  it('never goes below 14 pt (normal) / 18 pt (senior) for mixed-case text', () => {
    // Uppercase mono eyebrow is the only exception: 13 pt caps read like 15 pt lowercase.
    const mixed = (scale: typeof typography.normal) =>
      Object.values(scale).filter((style) => style.textTransform !== 'uppercase');
    for (const style of mixed(typography.normal)) expect(style.fontSize).toBeGreaterThanOrEqual(14);
    for (const style of mixed(typography.senior)) expect(style.fontSize).toBeGreaterThanOrEqual(18);
    expect(typography.normal.eyebrow.fontSize).toBeGreaterThanOrEqual(13);
    expect(typography.senior.eyebrow.fontSize).toBeGreaterThanOrEqual(17);
  });
});

describe('createTheme', () => {
  it('uses base colors and normal scale by default', () => {
    const theme = createTheme({ scheme: 'light', seniorMode: false });
    expect(theme.colors).toBe(colors.light);
    expect(theme.type.body.fontSize).toBe(17);
    expect(theme.layout.minTouch).toBe(44);
  });

  it('applies senior overrides on top of the scheme', () => {
    const theme = createTheme({ scheme: 'dark', seniorMode: true });
    expect(theme.colors.textMuted).toBe(seniorColorOverrides.dark.textMuted);
    expect(theme.colors.primary).toBe(colors.dark.primary);
    expect(theme.type.body.fontSize).toBe(22);
    expect(theme.layout.minTouch).toBe(56);
  });

  it('keeps min touch target >= 44 in every mode', () => {
    for (const scheme of schemes) {
      for (const seniorMode of [false, true]) {
        expect(createTheme({ scheme, seniorMode }).layout.minTouch).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

describe('waitBucket', () => {
  it.each([
    [null, 'unknown'],
    [0, 'short'],
    [14, 'short'],
    [15, 'medium'],
    [60, 'medium'],
    [61, 'long'],
  ] as const)('%s days -> %s', (days, bucket) => {
    expect(waitBucket(days)).toBe(bucket);
  });
});
