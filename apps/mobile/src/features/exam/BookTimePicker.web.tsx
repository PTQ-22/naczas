import { t } from '@/i18n';
import { useTheme } from '@/theme';

import type { BookTimePickerProps } from './book-time-picker-props';

/** Browser-native time field, styled like BookDatePicker.web. */
export function BookTimePicker({ value, onChange }: BookTimePickerProps) {
  const { colors, layout, radius, borderWidth, space, type } = useTheme();
  return (
    <input
      type="time"
      step={300}
      aria-label={t('exam.book.timeLabel')}
      value={value}
      // An emptied field keeps the last valid time instead of storing an invalid one.
      onChange={(e) => {
        if (/^\d{2}:\d{2}$/.test(e.target.value)) onChange(e.target.value);
      }}
      style={{
        minHeight: layout.minTouch,
        padding: `0 ${space.lg}px`,
        fontSize: type.bodyLarge.fontSize,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: colors.text,
        backgroundColor: colors.surface,
        border: `${borderWidth.strong}px solid ${colors.borderStrong}`,
        borderRadius: radius.md,
        colorScheme: 'light',
      }}
    />
  );
}
