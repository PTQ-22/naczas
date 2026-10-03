import { Text, View } from 'react-native';

import { cardElevation, useTheme } from '@/theme';

import type { ReactNode } from 'react';

interface PrepSectionProps {
  title: string;
  children: ReactNode;
}

/** TODO(WS4): replace with the shared Card component from src/components once it exists. */
export function PrepSection({ title, children }: PrepSectionProps) {
  const theme = useTheme();
  const { colors, layout, radius, borderWidth, type, space } = theme;
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: borderWidth.hairline,
        borderRadius: radius.lg,
        padding: layout.cardPadding,
        gap: space.sm,
        ...(theme.scheme === 'light' ? cardElevation : {}),
      }}
    >
      <Text accessibilityRole="header" style={[type.heading, { color: colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}
