import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface TimelineScaleOption<T extends string> {
  value: T;
  /** Short segment text, e.g. "Do 1,5 roku". */
  label: string;
  /** Full sentence, e.g. "W ciągu ostatnich półtora roku": read by screen readers, and shown
   * instead of `label` when the scale is stacked and has room for it. */
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

// A segment must fit its longest single word ("Ponad", "mies.") — RN never breaks inside a word,
// so a narrower segment would push the text past the screen edge. ~3 em covers those words.
const MIN_SEGMENT_EMS = 3;

/**
 * Single choice laid out as one segmented bar, so ordered answers ("kiedy ostatnio?") read as
 * a scale instead of a cloud of equal pills. When the segments get too narrow for the text
 * (small phone, system font scaling, senior mode) the bar turns into a vertical list, same order.
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
  const { colors, space, radius, borderWidth, layout, type } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const segmentText = (width - 2 * borderWidth.strong) / options.length - 2 * space.xs;
  const stacked = width > 0 && segmentText < type.label.fontSize * fontScale * MIN_SEGMENT_EMS;

  return (
    <View
      testID={testID}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: space.xs }}
    >
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={groupLabel}
        style={{
          flexDirection: stacked ? 'column' : 'row',
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
                flex: stacked ? undefined : 1,
                minHeight: layout.minTouch,
                justifyContent: 'center',
                paddingHorizontal: stacked ? space.md : space.xs,
                paddingVertical: space.sm,
                [stacked ? 'borderTopWidth' : 'borderLeftWidth']:
                  index === 0 ? 0 : borderWidth.hairline,
                borderColor: colors.border,
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
                style={{ textAlign: stacked ? 'left' : 'center' }}
              >
                {/* No ✓ prefix: it breaks wrapping in narrow segments; the solid fill is the cue. */}
                {stacked ? (option.accessibilityLabel ?? option.label) : option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!stacked && (
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
      )}
    </View>
  );
}
