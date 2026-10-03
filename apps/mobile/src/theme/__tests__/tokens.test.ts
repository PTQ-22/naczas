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

  it('is symmetric and matches values published in tokens.md §3', () => {
    expect(contrastRatio('#1E2A2D', '#FAF7F2')).toBeCloseTo(13.8, 1);
    expect(contrastRatio('#FAF7F2', '#1E2A2D')).toBeCloseTo(13.8, 1);
    expect(contrastRatio(colors.light.textSubtle, colors.light.surfaceAlt)).toBeCloseTo(4.9, 1);
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
    expect(typography.senior.body.fontSize).toBe(21);
    expect(typography.senior.display).toMatchObject({ fontSize: 42, lineHeight: 52 });
    expect(typography.senior.caption).toMatchObject({ fontSize: 18, lineHeight: 26 });
  });

  it('never goes below 14 pt (normal) / 18 pt (senior)', () => {
    for (const style of Object.values(typography.normal)) {
      expect(style.fontSize).toBeGreaterThanOrEqual(14);
    }
    for (const style of Object.values(typography.senior)) {
      expect(style.fontSize).toBeGreaterThanOrEqual(18);
    }
  });
});

describe('createTheme', () => {
  it('uses base colors and normal scale by default', () => {
    const theme = createTheme({ scheme: 'light', seniorMode: false });
    expect(theme.colors).toBe(colors.light);
    expect(theme.type.body.fontSize).toBe(16);
    expect(theme.layout.minTouch).toBe(44);
  });

  it('applies senior overrides on top of the scheme', () => {
    const theme = createTheme({ scheme: 'dark', seniorMode: true });
    expect(theme.colors.textMuted).toBe(seniorColorOverrides.dark.textMuted);
    expect(theme.colors.primary).toBe(colors.dark.primary);
    expect(theme.type.body.fontSize).toBe(21);
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
