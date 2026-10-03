import { useState } from 'react';

import type { Profile } from '@naczas/shared';

import { Button, Text, TextField } from '@/components';
import { t } from '@/i18n';
import { locateWithGps } from '@/services/location';
import { postalCodeToLocation } from '@/services/postal';

import { postalLocationLabel } from './location-label';

export type PickedLocation = NonNullable<Profile['location']>;

export interface LocationPickerValue {
  postalCode: string;
  location: PickedLocation | null;
}

interface LocationPickerProps extends LocationPickerValue {
  onChange: (value: LocationPickerValue) => void;
}

type GpsState = 'idle' | 'locating' | 'denied' | 'error';

/** GPS button + postal code field. Shared by the onboarding step and Settings. */
export function LocationPicker({ postalCode, location, onChange }: LocationPickerProps) {
  const [gps, setGps] = useState<GpsState>('idle');

  const locate = async () => {
    setGps('locating');
    const result = await locateWithGps();
    if (!result.ok) {
      setGps(result.reason);
      return;
    }
    setGps('idle');
    const province = t(`onboarding.steps.location.provinces.${result.point.province}`);
    onChange({
      postalCode: '',
      location: { ...result.point, label: t('onboarding.steps.location.gpsLabel', { province }) },
    });
  };

  // Applies as soon as the code is complete — no extra "confirm" button to find.
  const onPostalChange = (nextPostalCode: string) => {
    const point = postalCodeToLocation(nextPostalCode);
    if (!point) {
      onChange({ postalCode: nextPostalCode, location: postalCode ? null : location });
      return;
    }
    // `city` only feeds the label — Profile.location has no such field.
    const { city: _city, ...coords } = point;
    onChange({
      postalCode: nextPostalCode,
      location: { ...coords, label: postalLocationLabel(point) },
    });
  };

  const postalError =
    postalCode.length >= 5 && !postalCodeToLocation(postalCode)
      ? t('onboarding.steps.location.postalError')
      : null;
  const gpsMessage =
    gps === 'denied'
      ? t('onboarding.steps.location.gpsDenied')
      : gps === 'error'
        ? t('onboarding.steps.location.gpsError')
        : null;

  return (
    <>
      <Button
        variant="secondary"
        label={
          gps === 'locating'
            ? t('onboarding.steps.location.locating')
            : t('onboarding.steps.location.useGps')
        }
        loading={gps === 'locating'}
        onPress={() => void locate()}
        fullWidth
      />
      {gpsMessage && (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {gpsMessage}
        </Text>
      )}
      <TextField
        label={t('onboarding.steps.location.postalLabel')}
        placeholder={t('onboarding.steps.location.postalPlaceholder')}
        value={postalCode}
        onChangeText={onPostalChange}
        keyboardType="numbers-and-punctuation"
        maxLength={6}
        error={postalError}
      />
      {location && (
        <Text variant="bodyLarge" accessibilityLiveRegion="polite">
          {t('onboarding.steps.location.selected', { label: location.label })}
        </Text>
      )}
      <Text variant="caption" tone="textMuted">
        {t('onboarding.steps.location.privacy')}
      </Text>
    </>
  );
}
