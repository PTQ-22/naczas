import { OptionTile, Text, TextField } from '@/components';
import { t } from '@/i18n';

import { smokingQuestions } from '../survey';
import { parseWholeNumber, toggle, type StepProps } from './step-props';

const SMOKING = ['never', 'former', 'current'] as const;
const ACTIVITY = ['low', 'medium', 'high'] as const;

const numberText = (n: number | null) => (n === null ? '' : String(n));

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <>
      <OptionTile
        mode="radio"
        label={t('onboarding.steps.lifestyle.yes')}
        selected={value === true}
        onPress={() => onChange(true)}
      />
      <OptionTile
        mode="radio"
        label={t('onboarding.steps.lifestyle.no')}
        selected={value === false}
        onPress={() => onChange(false)}
      />
    </>
  );
}

/** Follow-ups appear only when they can change the plan (survey.ts `smokingQuestions`). */
export function LifestyleStep({ draft, update, today }: StepProps) {
  const asked = smokingQuestions(draft, today);
  const copd = draft.conditions.includes('copd');
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
          onPress={() => update({ smoking })}
        />
      ))}
      {asked.quit && (
        <>
          <Text variant="label">{t('onboarding.steps.lifestyle.quitLabel')}</Text>
          <OptionTile
            mode="radio"
            label={t('onboarding.steps.lifestyle.quit.within15y')}
            selected={draft.quitOver15y === false}
            onPress={() => update({ quitOver15y: false })}
          />
          <OptionTile
            mode="radio"
            label={t('onboarding.steps.lifestyle.quit.over15y')}
            selected={draft.quitOver15y === true}
            onPress={() => update({ quitOver15y: true })}
          />
        </>
      )}
      {asked.packYears && (
        <TextField
          label={t('onboarding.steps.lifestyle.packYearsLabel')}
          hint={t('onboarding.steps.lifestyle.packYearsHint')}
          value={numberText(draft.packYears)}
          onChangeText={(text) => update({ packYears: parseWholeNumber(text) })}
          keyboardType="number-pad"
          maxLength={2}
        />
      )}
      {asked.copd && (
        // A checkbox, not yes/no: COPD lives in `conditions`, where "not ticked" already means no.
        <OptionTile
          mode="checkbox"
          label={t('onboarding.steps.lifestyle.copdLabel')}
          selected={copd}
          onPress={() => update({ conditions: toggle(draft.conditions, 'copd') })}
        />
      )}
      {asked.otherLungRisk && (
        <>
          <Text variant="label">{t('onboarding.steps.lifestyle.otherLungRiskLabel')}</Text>
          <Text variant="caption" tone="textMuted">
            {t('onboarding.steps.lifestyle.otherLungRiskHint')}
          </Text>
          <YesNo
            value={draft.otherLungRisk}
            onChange={(otherLungRisk) => update({ otherLungRisk })}
          />
        </>
      )}
      <Text variant="label">{t('onboarding.steps.lifestyle.activityLabel')}</Text>
      <Text variant="caption" tone="textMuted">
        {t('onboarding.steps.lifestyle.activityNote')}
      </Text>
      {ACTIVITY.map((activity) => (
        <OptionTile
          key={activity}
          mode="radio"
          label={t(`onboarding.steps.lifestyle.activity.${activity}`)}
          selected={draft.activity === activity}
          onPress={() => update({ activity })}
        />
      ))}
    </>
  );
}
