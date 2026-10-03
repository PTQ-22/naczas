import { useMemo } from 'react';
import { View } from 'react-native';

import type { Plan } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { notificationId, useInAppReminders } from '@/notifications';
import { useTheme } from '@/theme';

interface ReminderBannerProps {
  /** Active profile's plan; other profiles' reminders show when the user switches to them. */
  plan: Plan;
}

/** Web stand-in for local notifications: the most urgent due reminder, one at a time. */
export function ReminderBanner({ plan }: ReminderBannerProps) {
  const { colors, space, borderWidth } = useTheme();
  const plans = useMemo(() => [plan], [plan]);
  const { reminders, dismiss } = useInAppReminders(plans);
  // "Time to book X" for an exam already on this plate would just repeat the queue number above
  // it; only other reminders (visit tomorrow, demo test) are worth a line here.
  const onPlate = new Set(plan.items.map((i) => notificationId(i.profileId, i.examId, 'notify')));
  const visible = reminders.filter((r) => !onPlate.has(r.id));
  const top = visible[0];
  if (!top) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        gap: space.xs,
        paddingBottom: space.md,
        borderBottomWidth: borderWidth.hairline,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <Icon name="time" size="sm" color={colors.primary} />
        <Text variant="eyebrow" color={colors.primary}>
          {t('plan.reminder.label')}
        </Text>
      </View>
      <Text variant="label">{top.title}</Text>
      <Text variant="caption" tone="textMuted">
        {top.body}
      </Text>
      {visible.length > 1 && (
        <Text variant="caption" tone="textMuted">
          {t('plan.reminder.more', { count: visible.length - 1 })}
        </Text>
      )}
      <Button
        variant="ghost"
        label={t('plan.reminder.close')}
        accessibilityLabel={t('plan.reminder.closeA11y', { title: top.title })}
        onPress={() => dismiss(top.id)}
      />
    </View>
  );
}
