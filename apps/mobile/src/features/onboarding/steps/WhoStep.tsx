import { OptionTile, Text } from '@/components';
import { t } from '@/i18n';

import { TextField } from '../ui/TextField';

import type { StepProps } from './step-props';

const RELATIONS = ['parent', 'partner', 'child', 'other'] as const;

export function WhoStep({ draft, update }: StepProps) {
  return (
    <>
      {!draft.forRelative && (
        <>
          <OptionTile
            mode="radio"
            label={t('onboarding.steps.who.self')}
            selected={draft.who === 'self'}
            onPress={() => update({ who: 'self' })}
          />
          <OptionTile
            mode="radio"
            label={t('onboarding.steps.who.other')}
            selected={draft.who === 'other'}
            onPress={() => update({ who: 'other' })}
          />
        </>
      )}
      {draft.who === 'other' && (
        <>
          <TextField
            label={t('onboarding.steps.who.nameLabel')}
            placeholder={t('onboarding.steps.who.namePlaceholder')}
            value={draft.name}
            onChangeText={(name) => update({ name })}
            maxLength={40}
          />
          <Text variant="label">{t('onboarding.steps.who.relationLabel')}</Text>
          {RELATIONS.map((relation) => (
            <OptionTile
              key={relation}
              mode="radio"
              label={t(`onboarding.steps.who.relation.${relation}`)}
              selected={draft.relation === relation}
              onPress={() => update({ relation })}
            />
          ))}
        </>
      )}
    </>
  );
}
