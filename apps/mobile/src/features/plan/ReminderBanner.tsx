import { useMemo } from 'react';
import { View } from 'react-native';

import type { Plan } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useInAppReminders } from '@/notifications';
import { useTheme } from '@/theme';

interface ReminderBannerProps {
  /** Active profile's plan; other profiles' reminders show when the user switches to them. */
  plan: Plan;
}

/** Web stand-in for local notifications: the most urgent due reminder, one at a time. */
export function ReminderBanner({ plan }: ReminderBannerProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  const plans = useMemo(() => [plan], [plan]);
  const { reminders, dismiss } = useInAppReminders(plans);
  const top = reminders[0];
  if (!top) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        gap: space.sm,
        padding: layout.cardPadding,
        borderRadius: radius.lg,
        borderWidth: borderWidth.hairline,
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
      }}
    >
      <Chip tone="primary" icon="time" label={t('plan.reminder.label')} />
      <Text variant="heading">{top.title}</Text>
      <Text>{top.body}</Text>
      {reminders.length > 1 && (
        <Text variant="caption" tone="textMuted">
          {t('plan.reminder.more', { count: reminders.length - 1 })}
        </Text>
      )}
      <Button
        variant="secondary"
        label={t('plan.reminder.close')}
        accessibilityLabel={t('plan.reminder.closeA11y', { title: top.title })}
        onPress={() => dismiss(top.id)}
      />
    </View>
  );
}
