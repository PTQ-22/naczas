import { Pressable } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

interface FiltersButtonProps {
  /** Narrowing filters in use (distance, amenities) — shown as "Filtry (2)". */
  activeCount: number;
  onPress: () => void;
}

/** Compact "Filtry" pill above the map; opens the filters sheet. */
export function FiltersButton({ activeCount, onPress }: FiltersButtonProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  const label =
    activeCount > 0
      ? t('doctors.filters.buttonActive', { count: activeCount })
      : t('doctors.filters.button');
  return (
    <Pressable
      testID="doctors-filters-button"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${t('doctors.filters.buttonA11y')}`}
      style={({ pressed }) => ({
        minHeight: layout.minTouch,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        paddingHorizontal: space.md,
        borderRadius: radius.full,
        borderWidth: borderWidth.strong,
        borderColor: activeCount > 0 ? colors.primary : colors.borderStrong,
        backgroundColor: pressed || activeCount > 0 ? colors.primarySoft : colors.surface,
      })}
    >
      <Icon name="filter" size="sm" color={colors.primary} />
      <Text variant="label" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}
