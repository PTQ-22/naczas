import { Pressable, Switch, View } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';

interface ToggleRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testID?: string;
}

/**
 * The whole row is the touch target and the accessible switch (≥ 44 pt, AGENTS.md §3);
 * the native Switch is only the visual.
 */
export function ToggleRow({ label, hint, value, onChange, testID }: ToggleRowProps) {
  const { colors, layout, space } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      style={{
        minHeight: layout.minTouch,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
      }}
    >
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="label">{label}</Text>
        {hint ? (
          <Text variant="caption" tone="textMuted">
            {hint}
          </Text>
        ) : null}
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        pointerEvents="none"
      >
        <Switch
          value={value}
          trackColor={{ false: colors.borderStrong, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
    </Pressable>
  );
}
