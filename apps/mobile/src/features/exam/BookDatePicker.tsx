import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import type { BookDatePickerProps } from './book-date-picker-props';

const toISO = (d: Date) => format(d, 'yyyy-MM-dd');
const fullDate = (iso: string) => format(parseISO(iso), 'dd.MM.yyyy');

/**
 * iOS: inline calendar (always visible, large targets). Android: the system dialog opens from a
 * field showing the current date — the platform picker brings its own accessibility.
 */
export function BookDatePicker({ value, min, max, onChange }: BookDatePickerProps) {
  const { colors, layout, radius, borderWidth, space } = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === 'set' && date) onChange(toISO(date));
  };

  const picker = (
    <DateTimePicker
      value={parseISO(value)}
      mode="date"
      display={Platform.OS === 'ios' ? 'inline' : 'default'}
      minimumDate={parseISO(min)}
      maximumDate={parseISO(max)}
      locale="pl-PL"
      themeVariant="light"
      accentColor={colors.primary}
      onChange={handleChange}
    />
  );

  if (Platform.OS === 'ios') return picker;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('exam.book.dateA11y', { date: fullDate(value) })}
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
          backgroundColor: colors.surface,
        }}
      >
        <Icon name="calendar" size="md" />
        <Text variant="bodyLarge" tabular>
          {fullDate(value)}
        </Text>
      </Pressable>
      {open && picker}
    </View>
  );
}
