import { Pressable } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** radio = one of a group, checkbox = any number. */
  role: 'radio' | 'checkbox';
  /** Defaults to `label`; groups prefix it with context (e.g. the exam name). */
  accessibilityLabel?: string;
  testID?: string;
}

/** Compact pill choice — the small sibling of OptionTile. Selected = soft bg + border + ✓. */
export function SelectableChip({
  label,
  selected,
  onPress,
  role,
  accessibilityLabel,
  testID,
}: SelectableChipProps) {
  const { colors, space, radius, borderWidth, layout } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        minHeight: layout.minTouch,
        justifyContent: 'center',
        paddingHorizontal: space.md,
        borderRadius: radius.full,
        borderWidth: borderWidth.strong,
        borderColor: selected ? colors.primary : colors.borderStrong,
        backgroundColor: selected || pressed ? colors.primarySoft : colors.surface,
      })}
    >
      <Text variant="label" tone={selected ? 'primary' : 'text'}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}
