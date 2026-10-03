import { router } from 'expo-router';

import { Button, Screen, Text } from '@/components';
import { t } from '@/i18n';

/** Unknown URL (e.g. a stale shared link on web). "/" routes on to the plan or onboarding. */
export default function NotFoundScreen() {
  return (
    <Screen
      footer={
        <Button
          label={t('onboarding.notFound.cta')}
          onPress={() => router.replace('/')}
          fullWidth
        />
      }
    >
      <Text variant="title" accessibilityRole="header">
        {t('onboarding.notFound.title')}
      </Text>
      <Text variant="bodyLarge">{t('onboarding.notFound.body')}</Text>
    </Screen>
  );
}
