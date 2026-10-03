import { router } from 'expo-router';

import { Button, Disclaimer, Screen, Text } from '@/components';
import { t } from '@/i18n';
import { useOnboardingDraftStore } from '@/store';

import { loadDemoProfile } from './complete-onboarding';

const FIRST_STEP = { pathname: '/onboarding/[step]', params: { step: '1' } } as const;

export default function WelcomeScreen() {
  const hasDraft = useOnboardingDraftStore((s) => s.draft !== null);
  const start = useOnboardingDraftStore((s) => s.start);

  const begin = () => {
    // An unfinished survey is resumed with its answers, never silently thrown away.
    if (!hasDraft) start();
    router.push(FIRST_STEP);
  };

  const loadDemo = () => {
    loadDemoProfile();
    router.replace('/plan');
  };

  return (
    <Screen
      footer={
        <>
          <Button
            label={hasDraft ? t('onboarding.welcome.resume') : t('onboarding.welcome.start')}
            onPress={begin}
            fullWidth
          />
          <Button
            variant="ghost"
            label={t('onboarding.welcome.loadDemo')}
            onPress={loadDemo}
            fullWidth
          />
        </>
      }
    >
      <Text variant="display" accessibilityRole="header">
        {t('onboarding.welcome.title')}
      </Text>
      <Text variant="bodyLarge">{t('onboarding.welcome.subtitle')}</Text>
      <Text tone="textMuted">{t('onboarding.welcome.privacy')}</Text>
      <Disclaimer text={t('onboarding.welcome.disclaimer')} />
    </Screen>
  );
}
