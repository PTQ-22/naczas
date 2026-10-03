import { Card, ChipGroup, Text } from '@/components';
import { t } from '@/i18n';
import { useOnboardingDraftStore } from '@/store';

import { lastDoneLabel } from '../last-done-labels';
import { lastExamQuestions } from '../survey';

import type { StepProps } from './step-props';

const ANSWERS = [
  'within_half_interval',
  'within_interval',
  'over_interval',
  'never',
  'unknown',
] as const;

export function LastExamsStep({ draft, today }: StepProps) {
  const setLastDone = useOnboardingDraftStore((s) => s.setLastDone);
  const exams = lastExamQuestions(draft, today);

  if (exams.length === 0) {
    return <Text tone="textMuted">{t('onboarding.steps.lastExams.empty')}</Text>;
  }
  return (
    <>
      {exams.map(({ rule, intervalMonths }) => (
        <Card key={rule.id}>
          <Text variant="heading">{rule.name}</Text>
          <ChipGroup
            groupLabel={rule.name}
            options={ANSWERS.map((value) => ({
              value,
              label: lastDoneLabel(value, intervalMonths),
            }))}
            selected={draft.lastDone[rule.id]}
            onSelect={(answer) => setLastDone(rule.id, answer)}
          />
        </Card>
      ))}
    </>
  );
}
