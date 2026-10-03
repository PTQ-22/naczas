import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { cardElevation, useTheme } from '@/theme';

import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** Left stripe colour (urgency accent). */
  accent?: string;
  /** Makes the whole card a button; requires `accessibilityLabel`. */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({
  children,
  accent,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: CardProps) {
  const { colors, radius, borderWidth, layout, scheme, space } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    padding: layout.cardPadding,
    gap: space.sm,
    overflow: 'hidden',
    ...(accent && { borderLeftWidth: borderWidth.accent, borderLeftColor: accent }),
    // Dark mode: no shadow — surface vs bg + border separates cards (tokens.md §2.2).
    ...(scheme === 'light' && { ...cardElevation, shadowColor: colors.text }),
  };

  if (!onPress) {
    return (
      <View testID={testID} style={[base, style]}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [base, pressed && { backgroundColor: colors.surfaceAlt }, style]}
    >
      {children}
    </Pressable>
  );
}
