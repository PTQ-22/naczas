import { Pressable } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

interface CalendarButtonProps {
  /** Blocks marked in the availability calendar — shown as "Kalendarz (3)". */
  markedCount: number;
  onPress: () => void;
}

/** "Kalendarz" pill next to "Filtry": when the patient can (or can't) come, for every call. */
export function CalendarButton({ markedCount, onPress }: CalendarButtonProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  const active = markedCount > 0;
  const label = active
    ? t('doctors.calendar.buttonActive', { count: markedCount })
    : t('doctors.calendar.button');
  return (
    <Pressable
      testID="doctors-calendar-button"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${t('doctors.calendar.buttonA11y')}`}
      style={({ pressed }) => ({
        minHeight: layout.minTouch,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        paddingHorizontal: space.md,
        borderRadius: radius.full,
        borderWidth: borderWidth.strong,
        borderColor: active ? colors.primary : colors.borderStrong,
        backgroundColor: pressed || active ? colors.primarySoft : colors.surface,
      })}
    >
      <Icon name="calendar" size="sm" color={colors.primary} />
      <Text variant="label" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}
