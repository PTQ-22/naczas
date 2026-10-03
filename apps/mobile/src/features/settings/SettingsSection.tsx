import { View } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';

import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  /** First section on the plate: no ink rule above it (the plate frame is already there). */
  first?: boolean;
  children: ReactNode;
}

/** A group on the settings plate: ink rule + mono eyebrow, no card (redesign v2 §4). */
export function SettingsSection({ title, first = false, children }: SettingsSectionProps) {
  const { colors, space, borderWidth } = useTheme();
  return (
    <View
      style={{
        gap: space.md,
        ...(!first && {
          paddingTop: space.md,
          borderTopWidth: borderWidth.strong,
          borderTopColor: colors.text,
        }),
      }}
    >
      <Text variant="eyebrow" tone="textMuted" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}
