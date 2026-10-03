import { View } from 'react-native';

import { useTheme } from '@/theme';

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  /** e.g. „Krok 5 z 7” */
  accessibilityLabel: string;
}

export function ProgressBar({ value, accessibilityLabel }: ProgressBarProps) {
  const { colors, radius, space } = useTheme();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height: space.sm,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: radius.full,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}
