import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { useNotificationPermission } from './use-notification-permission';

/**
 * Asks for notification permission in context — on the plan, after the user can see what we'd
 * remind them about (WS3-7), never on app start. Hidden once the OS answered or can't ask.
 */
export function NotificationPrompt() {
  const { colors, space } = useTheme();
  const { status, request } = useNotificationPermission();
  // "Nie teraz" hides it for this session only; the plan asks again next time.
  const [dismissed, setDismissed] = useState(false);

  if (status !== 'undetermined' || dismissed) return null;

  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
        <Icon name="time" color={colors.primary} />
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
          {t('plan.notifications.title')}
        </Text>
      </View>
      <Text tone="textMuted">{t('plan.notifications.body')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Button
          variant="secondary"
          label={t('plan.notifications.enable')}
          onPress={() => void request()}
        />
        <Button
          variant="ghost"
          label={t('plan.notifications.later')}
          onPress={() => setDismissed(true)}
        />
      </View>
    </Card>
  );
}
