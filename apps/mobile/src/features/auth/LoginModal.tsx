import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Plate, Screen, Text, TextField } from '@/components';
import { t } from '@/i18n';
import { AuthError, authenticate, type AuthErrorKind } from '@/services/auth';
import { syncFamily } from '@/services/cloud-sync';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

type Phase = 'form' | 'auth' | 'sync' | 'syncFailed';

const ERROR_KEY: Record<AuthErrorKind, Parameters<typeof t>[0]> = {
  invalid: 'auth.errors.invalid',
  exists: 'auth.errors.exists',
  notFound: 'auth.errors.notFound',
  validation: 'auth.errors.shortPassword',
  network: 'auth.errors.network',
  unknown: 'auth.errors.unknown',
};

/** Leaves the modal for `href` — dismissing first, so the target isn't stacked under it. */
function leaveTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}

/**
 * Konto Rodzinne login. The app moves on only after the family's data is down: going to the plan
 * straight away showed "Nie ma jeszcze profilu" while the (sleepy) server was still answering,
 * which looked like a failed login and sent people round the login loop again.
 */
export function LoginModal() {
  const { space } = useTheme();
  const setFamilyCode = useSettingsStore((s) => s.setFamilyCode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);
  const [familyCode, setCode] = useState<string | null>(null);

  const finishSync = async (code: string) => {
    setPhase('sync');
    try {
      const { profileCount } = await syncFamily(code);
      // No profile in the cloud yet: the welcome screen (now showing "zalogowano") starts one.
      leaveTo(profileCount > 0 ? '/(tabs)/agent' : '/onboarding/welcome');
    } catch {
      setPhase('syncFailed');
    }
  };

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError(t('auth.errors.missing'));
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError(t('auth.errors.shortPassword'));
      return;
    }
    setPhase('auth');
    try {
      const account = await authenticate(mode, email, password);
      setFamilyCode(account.familyCode);
      setCode(account.familyCode);
      await finishSync(account.familyCode);
    } catch (e) {
      setPhase('form');
      setError(t(e instanceof AuthError ? ERROR_KEY[e.kind] : 'auth.errors.unknown'));
    }
  };

  const busy = phase === 'auth' || phase === 'sync';

  return (
    <Screen wall>
      <Plate>
        <View style={{ gap: space.sm }}>
          <Text variant="heading" accessibilityRole="header">
            {t('auth.title')}
          </Text>
          <Text tone="textMuted">{t('auth.intro')}</Text>
        </View>

        {phase === 'syncFailed' && familyCode ? (
          <View accessibilityRole="alert" style={{ gap: space.sm }}>
            <Text tone="danger">{t('auth.syncFailed')}</Text>
            <Button label={t('auth.retry')} onPress={() => void finishSync(familyCode)} fullWidth />
            <Button
              variant="ghost"
              label={t('auth.continue')}
              onPress={() => leaveTo('/')}
              fullWidth
            />
          </View>
        ) : (
          <View style={{ gap: space.md }}>
            <Button
              label={t('auth.mObywatel')}
              variant="secondary"
              onPress={() => undefined}
              disabled
              fullWidth
            />
            <Text tone="textSubtle" style={{ textAlign: 'center' }}>
              {t('auth.orEmail')}
            </Text>
            <TextField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="auth-email"
            />
            <TextField
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              testID="auth-password"
            />
            {error && (
              <Text tone="danger" accessibilityRole="alert" testID="auth-error">
                {error}
              </Text>
            )}
            {busy && (
              <Text tone="textMuted" accessibilityLiveRegion="polite" testID="auth-progress">
                {phase === 'sync' ? t('auth.syncing') : t('auth.waking')}
              </Text>
            )}
            <Button
              testID="auth-submit"
              label={mode === 'login' ? t('auth.login') : t('auth.register')}
              loading={busy}
              onPress={() => void submit()}
              fullWidth
            />
            <Button
              variant="ghost"
              label={mode === 'login' ? t('auth.toRegister') : t('auth.toLogin')}
              disabled={busy}
              onPress={() => {
                setError(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              fullWidth
            />
            <Button
              variant="ghost"
              label={t('auth.close')}
              disabled={busy}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              fullWidth
            />
          </View>
        )}
      </Plate>
    </Screen>
  );
}
