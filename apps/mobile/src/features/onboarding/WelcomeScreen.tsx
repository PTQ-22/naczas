import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Button, Disclaimer, Screen, Text } from '@/components';
import { t } from '@/i18n';
import { useOnboardingDraftStore } from '@/store';

import { loadDemoProfile } from './complete-onboarding';
import { isForRelative } from './survey';

const FIRST_STEP = { pathname: '/onboarding/[step]', params: { step: '1' } } as const;

/**
 * `?for=other` (Family → "Dodaj osobę"): the user has seen this screen already, so start a
 * survey for a relative and go straight to step 1.
 */
export default function WelcomeScreen() {
  const params = useLocalSearchParams<{ for?: string }>();
  const forRelative = isForRelative(params.for);
  const hasDraft = useOnboardingDraftStore((s) => s.draft !== null);
  const start = useOnboardingDraftStore((s) => s.start);

  useEffect(() => {
    if (!forRelative) return;
    // Keep an unfinished relative survey; replace an unfinished "for me" one.
    if (!useOnboardingDraftStore.getState().draft?.forRelative) start({ forRelative: true });
    router.replace(FIRST_STEP);
  }, [forRelative, start]);

  const begin = () => {
    // An unfinished survey is resumed with its answers, never silently thrown away.
    if (!hasDraft) start();
    router.push(FIRST_STEP);
  };

  const loadDemo = () => {
    loadDemoProfile();
    router.replace('/plan');
  };

  if (forRelative) return null;

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
