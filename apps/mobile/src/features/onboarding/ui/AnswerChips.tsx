import { Pressable, View } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';

interface AnswerChipsProps<T extends string> {
  /** Read by screen readers before each option, e.g. the exam name. */
  groupLabel: string;
  options: readonly { value: T; label: string }[];
  selected: T | undefined;
  onSelect: (value: T) => void;
}

// TODO(WS4): replace with a selectable chip from src/components (current Chip is display-only).
/** Single-choice row of chips that wrap — compact alternative to OptionTile for step 7. */
export function AnswerChips<T extends string>({
  groupLabel,
  options,
  selected,
  onSelect,
}: AnswerChipsProps<T>) {
  const { colors, space, radius, borderWidth, layout } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${groupLabel}: ${option.label}`}
            accessibilityState={{ checked: isSelected }}
            style={({ pressed }) => ({
              minHeight: layout.minTouch,
              justifyContent: 'center',
              paddingHorizontal: space.md,
              borderRadius: radius.full,
              borderWidth: isSelected ? borderWidth.strong : borderWidth.hairline,
              borderColor: isSelected ? colors.primary : colors.borderStrong,
              backgroundColor: isSelected || pressed ? colors.primarySoft : colors.surface,
            })}
          >
            <Text variant="label" tone={isSelected ? 'primary' : 'text'}>
              {isSelected ? `✓ ${option.label}` : option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
