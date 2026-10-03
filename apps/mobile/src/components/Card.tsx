import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

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
  const { colors, radius, borderWidth, layout, space } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    borderCurve: 'continuous',
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    padding: layout.cardPadding,
    gap: space.sm,
    overflow: 'hidden',
    ...(accent && { borderLeftWidth: borderWidth.accent, borderLeftColor: accent }),
    // Flat by design: the queue ticket is the only element with a shadow (redesign §7).
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
