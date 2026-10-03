import { useState } from 'react';

import type { Profile } from '@naczas/shared';

import { Button, Text } from '@/components';
import { LocationPicker, type LocationPickerValue } from '@/features/onboarding/LocationPicker';
import { t } from '@/i18n';
import { useProfilesStore } from '@/store';

import { SettingsSection } from './SettingsSection';

const EMPTY: LocationPickerValue = { postalCode: '', location: null };

/** Shows and changes the active profile's location (used for the facility search). */
export function LocationSection({ profile }: { profile: Profile }) {
  const updateProfile = useProfilesStore((s) => s.updateProfile);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<LocationPickerValue>(EMPTY);
  const [saved, setSaved] = useState(false);

  // The picker only previews ("Wybrano: …"); nothing changes on the profile until "Zapisz".
  const save = () => {
    if (!value.location) return;
    updateProfile(profile.id, { location: value.location });
    setEditing(false);
    setValue(EMPTY);
    setSaved(true);
  };

  const startEditing = () => {
    setSaved(false);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setValue(EMPTY);
  };

  return (
    <SettingsSection title={t('settings.location.header')}>
      <Text tone="textMuted">{t('settings.location.forProfile', { name: profile.name })}</Text>
      <Text variant="label" testID="settings-location-current">
        {t('settings.location.current', {
          label: profile.location?.label ?? t('settings.location.none'),
        })}
      </Text>
      {saved ? (
        <Text accessibilityLiveRegion="polite" tone="textMuted">
          {t('settings.location.saved')}
        </Text>
      ) : null}
      {editing ? (
        <>
          <LocationPicker
            postalCode={value.postalCode}
            location={value.location}
            onChange={setValue}
          />
          <Button
            testID="settings-location-save"
            label={t('settings.location.save')}
            accessibilityLabel={t('settings.location.saveA11y')}
            disabled={!value.location}
            onPress={save}
            fullWidth
          />
          <Button
            testID="settings-location-cancel"
            variant="ghost"
            label={t('settings.location.cancel')}
            accessibilityLabel={t('settings.location.cancelA11y')}
            onPress={cancel}
          />
        </>
      ) : (
        <Button
          testID="settings-location-change"
          variant="secondary"
          label={t('settings.location.change')}
          onPress={startEditing}
        />
      )}
    </SettingsSection>
  );
}
