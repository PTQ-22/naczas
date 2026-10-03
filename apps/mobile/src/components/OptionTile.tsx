import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

interface OptionTileProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** checkbox = multi-select, radio = single-select (screens.md §1 A11y). */
  mode: 'checkbox' | 'radio';
  testID?: string;
}

/**
 * Survey choice as a full-width row on the plate (redesign §4: rows with a radio, no cards).
 * Selection = filled radio/checkbox with ✓ + soft cobalt row + bold label, not colour alone.
 */
export function OptionTile({
  label,
  description,
  selected,
  onPress,
  mode,
  testID,
}: OptionTileProps) {
  const { colors, layout, radius, borderWidth, space } = useTheme();
  const box = layout.icon.md;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole={mode}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        minHeight: layout.optionTileMinHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.sm,
        paddingVertical: space.md,
        borderRadius: radius.sm,
        borderCurve: 'continuous',
        borderBottomWidth: borderWidth.hairline,
        borderBottomColor: colors.border,
        backgroundColor: selected || pressed ? colors.primarySoft : 'transparent',
      })}
    >
      <View
        style={{
          width: box,
          height: box,
          borderRadius: mode === 'radio' ? radius.full : radius.sm,
          borderWidth: borderWidth.strong,
          borderColor: selected ? colors.primary : colors.borderStrong,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <Icon name="check" size="sm" color={colors.onPrimary} />}
      </View>
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant={selected ? 'label' : 'bodyLarge'}>{label}</Text>
        {description && <Text tone="textMuted">{description}</Text>}
      </View>
    </Pressable>
  );
}
