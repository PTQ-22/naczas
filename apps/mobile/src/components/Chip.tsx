import { View } from 'react-native';

import type { Urgency } from '@naczas/shared';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ChipTone = Urgency | 'primary';

interface ChipProps {
  label: string;
  tone: ChipTone;
  icon?: IconName;
  /** Small dot in the tone's accent colour instead of an icon (e.g. wait-time chip). */
  dot?: boolean;
}

/** Non-interactive status label: soft bg + fg text + icon. Never colour alone (WCAG 1.4.1). */
export function Chip({ label, tone, icon, dot }: ChipProps) {
  const { colors, radius, space, layout } = useTheme();
  const palette =
    tone === 'primary'
      ? { fg: colors.primary, bg: colors.primarySoft, accent: colors.primary }
      : colors.urgency[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: space.xs,
        backgroundColor: palette.bg,
        borderRadius: radius.full,
        paddingHorizontal: space.md,
        paddingVertical: space.xs,
      }}
    >
      {dot && (
        <View
          style={{
            width: layout.icon.sm / 2,
            height: layout.icon.sm / 2,
            borderRadius: radius.full,
            backgroundColor: palette.accent,
          }}
        />
      )}
      {icon && <Icon name={icon} size="sm" color={palette.fg} />}
      <Text variant="label" color={palette.fg} style={{ flexShrink: 1 }}>
        {label}
      </Text>
    </View>
  );
}
