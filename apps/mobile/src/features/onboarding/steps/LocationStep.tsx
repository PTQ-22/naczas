import { useState } from 'react';

import { Button, Text } from '@/components';
import { t } from '@/i18n';
import { locateWithGps } from '@/services/location';
import { normalizePostalCode, postalCodeToLocation } from '@/services/postal';

import { TextField } from '../ui/TextField';

import type { StepProps } from './step-props';

type GpsState = 'idle' | 'locating' | 'denied' | 'error';

export function LocationStep({ draft, update }: StepProps) {
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
    update({
      postalCode: '',
      location: { ...result.point, label: t('onboarding.steps.location.gpsLabel', { province }) },
    });
  };

  // Applies as soon as the code is complete — no extra "confirm" button to find.
  const onPostalChange = (postalCode: string) => {
    const point = postalCodeToLocation(postalCode);
    const code = normalizePostalCode(postalCode);
    if (!point || !code) {
      update({ postalCode, location: draft.postalCode ? null : draft.location });
      return;
    }
    const province = t(`onboarding.steps.location.provinces.${point.province}`);
    update({
      postalCode,
      location: {
        ...point,
        label: t('onboarding.steps.location.postalLocationLabel', { code, province }),
      },
    });
  };

  const postalError =
    draft.postalCode.length >= 5 && !postalCodeToLocation(draft.postalCode)
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
        value={draft.postalCode}
        onChangeText={onPostalChange}
        keyboardType="numbers-and-punctuation"
        maxLength={6}
        error={postalError}
      />
      {draft.location && (
        <Text variant="bodyLarge" accessibilityLiveRegion="polite">
          {t('onboarding.steps.location.selected', { label: draft.location.label })}
        </Text>
      )}
      <Text variant="caption" tone="textMuted">
        {t('onboarding.steps.location.privacy')}
      </Text>
    </>
  );
}
