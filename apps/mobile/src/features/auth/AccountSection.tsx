import { format } from 'date-fns';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Text } from '@/components';
import { t } from '@/i18n';
import { useCloudSync, useSyncStatus } from '@/services/cloud-sync';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

/** Konto Rodzinne in Settings: log in from here too (not only from the welcome screen). */
export function AccountSection() {
  const { space } = useTheme();
  const setFamilyCode = useSettingsStore((s) => s.setFamilyCode);
  const { familyCode, syncing, lastSync, error, syncNow } = useCloudSync();

  if (!familyCode) {
    return (
      <View style={{ gap: space.sm }}>
        <Text tone="textMuted">{t('auth.account.loggedOut')}</Text>
        <Button
          testID="account-login"
          variant="secondary"
          label={t('auth.account.login')}
          onPress={() => router.push('/login')}
          fullWidth
        />
      </View>
    );
  }

  const status = syncing
    ? t('auth.account.syncing')
    : error
      ? t('auth.account.syncError')
      : lastSync
        ? t('auth.account.synced', { time: format(lastSync, 'HH:mm') })
        : t('auth.account.neverSynced');

  return (
    <View style={{ gap: space.sm }}>
      <Text>{t('auth.account.loggedIn')}</Text>
      <Text tone="textMuted" testID="account-code">
        {t('auth.account.code', { code: familyCode })}
      </Text>
      <Text
        tone={error && !syncing ? 'danger' : 'textMuted'}
        accessibilityLiveRegion="polite"
        testID="account-sync-status"
      >
        {status}
      </Text>
      <Button
        variant="secondary"
        icon="time"
        label={t('auth.account.syncNow')}
        loading={syncing}
        onPress={syncNow}
        fullWidth
      />
      <Button
        testID="account-logout"
        variant="ghost"
        label={t('auth.account.logout')}
        accessibilityHint={t('auth.account.logoutHint')}
        onPress={() => {
          setFamilyCode(null);
          // Next login (maybe another family) must do its own first sync.
          useSyncStatus.setState({ initialSyncFor: null, lastSync: null, error: null });
        }}
        fullWidth
      />
    </View>
  );
}
