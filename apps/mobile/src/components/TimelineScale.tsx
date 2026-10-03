import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface TimelineScaleOption<T extends string> {
  value: T;
  /** Short segment text, e.g. "Do 1,5 roku". */
  label: string;
  /** Full sentence for screen readers, e.g. "W ciągu ostatnich półtora roku". */
  accessibilityLabel?: string;
}

export interface TimelineScaleProps<T extends string> {
  /** Read by screen readers before each option, e.g. the exam name. */
  groupLabel: string;
  /** Ordered from the most recent to the furthest back. */
  options: readonly TimelineScaleOption<T>[];
  selected: T | undefined;
  onSelect: (value: T) => void;
  /** Captions under both ends of the bar, e.g. "← niedawno" / "dawniej →". */
  startLabel: string;
  endLabel: string;
  testID?: string;
}

/**
 * Single choice laid out as one segmented bar, so ordered answers ("kiedy ostatnio?") read as
 * a scale instead of a cloud of equal pills. Segments share the width and grow in height when
 * large fonts make labels wrap, so the bar never wraps onto a second row.
 */
export function TimelineScale<T extends string>({
  groupLabel,
  options,
  selected,
  onSelect,
  startLabel,
  endLabel,
  testID,
}: TimelineScaleProps<T>) {
  const { colors, space, radius, borderWidth, layout } = useTheme();

  return (
    <View testID={testID} style={{ gap: space.xs }}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={groupLabel}
        style={{
          flexDirection: 'row',
          borderWidth: borderWidth.strong,
          borderColor: colors.borderStrong,
          borderRadius: radius.md,
          overflow: 'hidden',
        }}
      >
        {options.map((option, index) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={`${groupLabel}: ${option.accessibilityLabel ?? option.label}`}
              accessibilityState={{ checked: isSelected }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: layout.minTouch,
                justifyContent: 'center',
                paddingHorizontal: space.xs,
                paddingVertical: space.sm,
                borderLeftWidth: index === 0 ? 0 : borderWidth.hairline,
                borderLeftColor: colors.border,
                backgroundColor: isSelected
                  ? colors.primary
                  : pressed
                    ? colors.primarySoft
                    : colors.surface,
              })}
            >
              <Text
                variant="label"
                tone={isSelected ? 'onPrimary' : 'text'}
                style={{ textAlign: 'center' }}
              >
                {/* No ✓ prefix: it breaks wrapping in narrow segments; the solid fill is the cue. */}
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View
        // Decorative axis; the order is already conveyed by the option labels.
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      >
        <Text variant="caption" tone="textMuted">
          {startLabel}
        </Text>
        <Text variant="caption" tone="textMuted">
          {endLabel}
        </Text>
      </View>
    </View>
  );
}
