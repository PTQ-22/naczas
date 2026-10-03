import { OptionTile, Text, TextField } from '@/components';
import { t } from '@/i18n';

import { birthYearRange, isBirthYearValid } from '../survey';
import { parseWholeNumber, type StepProps } from './step-props';

const SEXES = ['female', 'male'] as const;

export function BasicsStep({ draft, update, today }: StepProps) {
  const yearText = draft.birthYear === null ? '' : String(draft.birthYear);
  // Only complain once a full year is typed — not on every keystroke.
  const showError = yearText.length === 4 && !isBirthYearValid(draft.birthYear, today);
  return (
    <>
      <TextField
        label={t('onboarding.steps.basics.birthYearLabel')}
        value={yearText}
        onChangeText={(text) => update({ birthYear: parseWholeNumber(text) })}
        keyboardType="number-pad"
        maxLength={4}
        error={
          showError ? t('onboarding.steps.basics.birthYearError', birthYearRange(today)) : null
        }
      />
      <Text variant="label">{t('onboarding.steps.basics.sexLabel')}</Text>
      {SEXES.map((sex) => (
        <OptionTile
          key={sex}
          mode="radio"
          label={t(`onboarding.steps.basics.sex.${sex}`)}
          selected={draft.sex === sex}
          onPress={() => update({ sex })}
        />
      ))}
    </>
  );
}
