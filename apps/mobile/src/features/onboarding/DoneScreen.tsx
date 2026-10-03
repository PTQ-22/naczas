import { router } from 'expo-router';

import { Button, Screen, Text } from '@/components';
import { t } from '@/i18n';

// TODO(WS4): animated transition to the plan (docs/01-user-journey.md — onboarding/done).
export default function DoneScreen() {
  return (
    <Screen
      footer={
        <Button
          label={t('onboarding.done.cta')}
          onPress={() => router.replace('/plan')}
          fullWidth
        />
      }
    >
      <Text variant="display" accessibilityRole="header">
        {t('onboarding.done.title')}
      </Text>
      <Text variant="bodyLarge">{t('onboarding.done.subtitle')}</Text>
    </Screen>
  );
}
