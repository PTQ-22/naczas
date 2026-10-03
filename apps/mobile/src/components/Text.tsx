import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ColorTokens, type TypeVariant } from '@/theme';

/** Plain-colour tokens usable as text colour (urgency colours go through `color`). */
export type TextTone = Extract<
  keyof ColorTokens,
  'text' | 'textMuted' | 'textSubtle' | 'primary' | 'onPrimary' | 'danger'
>;

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: TextTone;
  /** Explicit colour from the theme (e.g. `colors.urgency.act_now.fg`); overrides `tone`. */
  color?: string;
  /** Tabular digits for dates / week counts in lists so columns don't jitter. */
  tabular?: boolean;
}

/** Typography from tokens. Font scaling stays on — layouts must wrap, not clip. */
export function Text({
  variant = 'body',
  tone = 'text',
  color,
  tabular,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        theme.type[variant],
        { color: color ?? theme.colors[tone] },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
