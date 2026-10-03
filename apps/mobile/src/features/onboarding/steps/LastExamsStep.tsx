import { Card, Text } from '@/components';
import { t } from '@/i18n';
import { useOnboardingDraftStore } from '@/store';

import { examsToAsk } from '../survey';
import { AnswerChips } from '../ui/AnswerChips';

import type { StepProps } from './step-props';

const ANSWERS = ['within_1y', '1_3y', 'over_3y', 'never', 'unknown'] as const;
const answerOptions = ANSWERS.map((value) => ({
  value,
  label: t(`onboarding.steps.lastExams.answers.${value}`),
}));

export function LastExamsStep({ draft, today }: StepProps) {
  const setLastDone = useOnboardingDraftStore((s) => s.setLastDone);
  const exams = examsToAsk(draft, today);

  if (exams.length === 0) {
    return <Text tone="textMuted">{t('onboarding.steps.lastExams.empty')}</Text>;
  }
  return (
    <>
      {exams.map((rule) => (
        <Card key={rule.id}>
          <Text variant="heading">{rule.name}</Text>
          <AnswerChips
            groupLabel={rule.name}
            options={answerOptions}
            selected={draft.lastDone[rule.id]}
            onSelect={(answer) => setLastDone(rule.id, answer)}
          />
        </Card>
      ))}
    </>
  );
}
