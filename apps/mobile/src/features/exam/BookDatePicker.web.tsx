import { t } from '@/i18n';
import { useTheme } from '@/theme';

import type { BookDatePickerProps } from './book-date-picker-props';

/** Browser-native date field: keyboard, screen readers and locale formatting come for free. */
export function BookDatePicker({ value, min, max, onChange }: BookDatePickerProps) {
  const { colors, layout, radius, borderWidth, space, type } = useTheme();
  return (
    <input
      type="date"
      aria-label={t('exam.book.dateLabel')}
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      style={{
        minHeight: layout.minTouch,
        padding: `0 ${space.lg}px`,
        fontSize: type.bodyLarge.fontSize,
        // Same stack react-native-web uses for <Text>; 'inherit' would pick the body's serif.
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: colors.text,
        backgroundColor: colors.surface,
        border: `${borderWidth.strong}px solid ${colors.borderStrong}`,
        borderRadius: radius.md,
        // Makes the browser's own calendar popup stay light, like the app.
        colorScheme: 'light',
      }}
    />
  );
}
