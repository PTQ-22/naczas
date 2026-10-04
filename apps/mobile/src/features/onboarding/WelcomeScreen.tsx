import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Button, Disclaimer, Plate, Screen, Text } from '@/components';
import { t } from '@/i18n';
import { isSyncEnabled } from '@/services/feature-flags';
import { useOnboardingDraftStore, useSettingsStore, useToday } from '@/store';

import { loadDemoPreset } from './demo-preset';
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
  const today = useToday();
  const syncEnabled = isSyncEnabled();
  const hasFamilyCode = useSettingsStore((s) => s.familyCode !== null);
  const loggedIn = syncEnabled && hasFamilyCode;

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
    loadDemoPreset(today);
    router.replace('/(tabs)/agent');
  };

  if (forRelative) return null;

  return (
    <Screen
      wall
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
          {/* Logged in already (empty family): no second login — that was the "login loop". */}
          {syncEnabled && !loggedIn && (
            <Button
              variant="secondary"
              label={t('onboarding.welcome.login')}
              onPress={() => router.push('/login')}
              fullWidth
            />
          )}
        </>
      }
    >
      <Plate>
        <Text variant="display" accessibilityRole="header">
          {t('onboarding.welcome.title')}
        </Text>
        <Text variant="bodyLarge">{t('onboarding.welcome.subtitle')}</Text>
        <Text tone="textMuted">{t('onboarding.welcome.privacy')}</Text>
        {loggedIn && (
          <Text tone="primary" testID="welcome-logged-in">
            {t('auth.welcomeLoggedIn')}
          </Text>
        )}
        <Disclaimer text={t('onboarding.welcome.disclaimer')} />
      </Plate>
    </Screen>
  );
}
