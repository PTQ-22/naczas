import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Two-option radio group (screens.md §4: "radiogroup" / "radio", min touch from tokens).
 * TODO(WS4): replace with a shared SegmentedControl from src/components if one is added.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors, layout, radius, space } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        // iOS-style segmented track: soft fill, no outline.
        flexDirection: 'row',
        borderRadius: radius.md,
        borderCurve: 'continuous',
        padding: 3,
        gap: 3,
        backgroundColor: colors.surfaceAlt,
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minHeight: layout.minTouch,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.md - 3,
              borderCurve: 'continuous',
              paddingHorizontal: space.sm,
              backgroundColor: selected ? colors.primary : 'transparent',
            }}
          >
            <Text variant="label" color={selected ? colors.onPrimary : colors.text}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
