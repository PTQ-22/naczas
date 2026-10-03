import { router } from 'expo-router';
import { View } from 'react-native';

import type { Profile } from '@naczas/shared';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { deleteProfileWithData, useProfilesStore, useToday } from '@/store';
import { useTheme } from '@/theme';

import { confirmDestructive } from './confirm-destructive';
import { FamilyMemberRow } from './FamilyMemberRow';

// TODO(WS3): onboarding reads `for=other` to start the survey for a relative, not for "me".
const addPerson = () => router.push({ pathname: '/onboarding/welcome', params: { for: 'other' } });

export default function FamilyScreen() {
  const { space } = useTheme();
  const profiles = useProfilesStore((s) => s.profiles);
  const activeProfileId = useProfilesStore((s) => s.activeProfileId);
  const setActiveProfile = useProfilesStore((s) => s.setActiveProfile);
  const today = useToday();

  const remove = async (profile: Profile) => {
    const confirmed = await confirmDestructive({
      title: t('profiles.removeConfirmTitle', { name: profile.name }),
      message: t('profiles.removeConfirmBody'),
      confirmLabel: t('profiles.removeConfirm'),
      cancelLabel: t('profiles.cancel'),
    });
    // Drops the person's exam records too — health data must not linger on the device.
    if (confirmed) deleteProfileWithData(profile.id);
  };

  if (profiles.length === 0) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState
          icon="people"
          title={t('profiles.empty')}
          action={{ label: t('profiles.emptyCta'), onPress: addPerson }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={['left', 'right']}
      footer={
        <Button
          label={t('profiles.add')}
          accessibilityHint={t('profiles.addHint')}
          icon="plus"
          onPress={addPerson}
          fullWidth
        />
      }
    >
      <Text variant="bodyLarge" tone="textMuted">
        {t('profiles.subtitle')}
      </Text>
      <View accessibilityRole="radiogroup" style={{ gap: space.md }}>
        {profiles.map((p) => (
          <FamilyMemberRow
            key={p.id}
            profile={p}
            active={p.id === activeProfileId}
            today={today}
            onSelect={setActiveProfile}
            onRemove={(profile) => void remove(profile)}
          />
        ))}
      </View>
    </Screen>
  );
}
