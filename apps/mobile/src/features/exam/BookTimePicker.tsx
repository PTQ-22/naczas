import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import type { BookTimePickerProps } from './book-time-picker-props';

/** The picker works on Date; only the wall-clock part matters, the day is irrelevant. */
const toDate = (hhmm: string) => {
  const [h = 9, m = 0] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1);
  d.setHours(h, m, 0, 0);
  return d;
};

/**
 * iOS: compact system time pill (tap → wheel popover). Android: field opening the system clock
 * dialog — same pattern as BookDatePicker.
 */
export function BookTimePicker({ value, onChange }: BookTimePickerProps) {
  const { colors, layout, radius, borderWidth, space, scheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === 'set' && date) onChange(format(date, 'HH:mm'));
  };

  const picker = (
    <DateTimePicker
      value={toDate(value)}
      mode="time"
      display={Platform.OS === 'ios' ? 'compact' : 'default'}
      is24Hour
      minuteInterval={5}
      locale="pl-PL"
      themeVariant={scheme}
      accentColor={colors.primary}
      onChange={handleChange}
      accessibilityLabel={t('exam.book.timeA11y', { time: value })}
    />
  );

  if (Platform.OS === 'ios') {
    return (
      <View
        style={{
          minHeight: layout.minTouch,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.md,
        }}
      >
        <Text variant="bodyLarge">{t('exam.book.timeLabel')}</Text>
        {picker}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('exam.book.timeA11y', { time: value })}
        onPress={() => setOpen(true)}
        style={{
          minHeight: layout.minTouch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingHorizontal: space.lg,
          borderWidth: borderWidth.strong,
          borderColor: colors.borderStrong,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          backgroundColor: colors.surface,
        }}
      >
        <Icon name="time" size="md" />
        <Text variant="bodyLarge" tabular>
          {value}
        </Text>
      </Pressable>
      {open && picker}
    </View>
  );
}
