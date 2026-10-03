import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/theme';

interface PrimaryButtonProps {
  label: string;
  hint?: string;
  busy?: boolean;
  onPress: () => void;
}

/** TODO(WS4): replace with the shared Button component from src/components once it exists. */
export function PrimaryButton({ label, hint, busy = false, onPress }: PrimaryButtonProps) {
  const { colors, layout, radius, space, type } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: layout.minTouch,
        minWidth: layout.minTouch,
        borderRadius: radius.md,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: space.sm,
        backgroundColor: pressed || busy ? colors.primaryPressed : colors.primary,
      })}
    >
      {busy ? <ActivityIndicator color={colors.onPrimary} /> : null}
      <Text style={[type.label, { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}
