import { Button, Card, Text, TimelineScale } from '@/components';
import { t } from '@/i18n';
import { useOnboardingDraftStore } from '@/store';

import { lastDoneLabel } from '../last-done-labels';
import { lastExamQuestions } from '../survey';

import type { StepProps } from './step-props';

// 'unknown' is not a segment: leaving the scale empty means "nie pamiętam" — the plan treats a
// missing answer exactly like 'unknown' (due from today), so a fifth option would only add noise.
const ANSWERS = ['within_half_interval', 'within_interval', 'over_interval', 'never'] as const;

export function LastExamsStep({ draft, today }: StepProps) {
  const setLastDone = useOnboardingDraftStore((s) => s.setLastDone);
  const clearLastDone = useOnboardingDraftStore((s) => s.clearLastDone);
  const exams = lastExamQuestions(draft, today);

  if (exams.length === 0) {
    return <Text tone="textMuted">{t('onboarding.steps.lastExams.empty')}</Text>;
  }
  return (
    <>
      {exams.map(({ rule, intervalMonths }) => {
        const answer = draft.lastDone[rule.id];
        // Answers saved as 'unknown' before this screen existed show as empty, too.
        const selected = answer === 'unknown' ? undefined : answer;
        return (
          <Card key={rule.id}>
            <Text variant="heading">{rule.name}</Text>
            <TimelineScale
              groupLabel={rule.name}
              options={ANSWERS.map((value) => ({
                value,
                label: lastDoneLabel(value, intervalMonths, 'short'),
                accessibilityLabel: lastDoneLabel(value, intervalMonths),
              }))}
              selected={selected}
              onSelect={(value) => setLastDone(rule.id, value)}
            />
            {selected ? (
              <Button
                variant="ghost"
                label={t('onboarding.steps.lastExams.clear')}
                accessibilityLabel={t('onboarding.steps.lastExams.clearA11y', { exam: rule.name })}
                onPress={() => clearLastDone(rule.id)}
              />
            ) : (
              <Text variant="caption" tone="textMuted">
                {t('onboarding.steps.lastExams.unanswered')}
              </Text>
            )}
          </Card>
        );
      })}
    </>
  );
}
