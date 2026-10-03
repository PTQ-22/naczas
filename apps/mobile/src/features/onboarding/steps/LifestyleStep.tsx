import { OptionTile, Text } from '@/components';
import { t } from '@/i18n';

import { parseWholeNumber, type StepProps } from './step-props';
import { TextField } from '../ui/TextField';

const SMOKING = ['never', 'former', 'current'] as const;
const ACTIVITY = ['low', 'medium', 'high'] as const;

const numberText = (n: number | null) => (n === null ? '' : String(n));

export function LifestyleStep({ draft, update }: StepProps) {
  const smokes = draft.smoking === 'current' || draft.smoking === 'former';
  return (
    <>
      <Text variant="label">{t('onboarding.steps.lifestyle.smokingLabel')}</Text>
      {/* Skipped smoking is saved as 'never' (contract needs a status) — say what that costs. */}
      <Text variant="caption" tone="textMuted">
        {t('onboarding.steps.lifestyle.smokingNote')}
      </Text>
      {SMOKING.map((smoking) => (
        <OptionTile
          key={smoking}
          mode="radio"
          label={t(`onboarding.steps.lifestyle.smoking.${smoking}`)}
          selected={draft.smoking === smoking}
          onPress={() =>
            update({ smoking, packYears: smoking === 'never' ? null : draft.packYears })
          }
        />
      ))}
      {smokes && (
        <TextField
          label={t('onboarding.steps.lifestyle.packYearsLabel')}
          value={numberText(draft.packYears)}
          onChangeText={(text) => update({ packYears: parseWholeNumber(text) })}
          keyboardType="number-pad"
          maxLength={2}
        />
      )}
      <Text variant="label">{t('onboarding.steps.lifestyle.activityLabel')}</Text>
      {ACTIVITY.map((activity) => (
        <OptionTile
          key={activity}
          mode="radio"
          label={t(`onboarding.steps.lifestyle.activity.${activity}`)}
          selected={draft.activity === activity}
          onPress={() => update({ activity })}
        />
      ))}
      <TextField
        label={t('onboarding.steps.lifestyle.heightLabel')}
        value={numberText(draft.heightCm)}
        onChangeText={(text) => update({ heightCm: parseWholeNumber(text) })}
        keyboardType="number-pad"
        maxLength={3}
      />
      <TextField
        label={t('onboarding.steps.lifestyle.weightLabel')}
        value={numberText(draft.weightKg)}
        onChangeText={(text) => update({ weightKg: parseWholeNumber(text) })}
        keyboardType="number-pad"
        maxLength={3}
      />
    </>
  );
}
