import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, ProgressBar, Screen, Text } from '@/components';
import { t, type MessageKey } from '@/i18n';
import { useOnboardingDraftStore, useToday, type OnboardingDraft } from '@/store';
import { useTheme } from '@/theme';

import { completeOnboarding } from './complete-onboarding';
import { BasicsStep } from './steps/BasicsStep';
import { LastExamsStep } from './steps/LastExamsStep';
import { LifestyleStep } from './steps/LifestyleStep';
import { LocationStep } from './steps/LocationStep';
import { MultiChoiceStep } from './steps/MultiChoiceStep';
import { toggle, type StepProps } from './steps/step-props';
import { WhoStep } from './steps/WhoStep';
import {
  canContinue,
  isSkippable,
  parseStepParam,
  skipPatch,
  STEP_COUNT,
  stepName,
  type SurveyStep,
} from './survey';

const CONDITIONS = ['diabetes', 'hypertension', 'heart_disease', 'other'] as const;
const FAMILY_HISTORY = [
  'breast_cancer',
  'colorectal_cancer',
  'prostate_cancer',
  'ovarian_cancer',
  'early_cardiovascular',
] as const;

const HINTS: Partial<Record<SurveyStep, MessageKey>> = {
  location: 'onboarding.steps.location.hint',
  conditions: 'onboarding.steps.conditions.hint',
  familyHistory: 'onboarding.steps.familyHistory.hint',
  lastExams: 'onboarding.steps.lastExams.hint',
};

function StepBody({ step, ...props }: StepProps & { step: SurveyStep }) {
  const { draft, update } = props;
  switch (step) {
    case 'who':
      return <WhoStep {...props} />;
    case 'basics':
      return <BasicsStep {...props} />;
    case 'location':
      return <LocationStep {...props} />;
    case 'conditions':
      return (
        <MultiChoiceStep
          options={CONDITIONS.map((value) => ({
            value,
            label: t(`onboarding.steps.conditions.options.${value}`),
          }))}
          selected={draft.conditions}
          onToggle={(value) => update({ conditions: toggle(draft.conditions, value) })}
        />
      );
    case 'familyHistory':
      return (
        <MultiChoiceStep
          options={FAMILY_HISTORY.map((value) => ({
            value,
            label: t(`onboarding.steps.familyHistory.options.${value}`),
          }))}
          selected={draft.familyHistory}
          onToggle={(value) => update({ familyHistory: toggle(draft.familyHistory, value) })}
        />
      );
    case 'lifestyle':
      return <LifestyleStep {...props} />;
    case 'lastExams':
      return <LastExamsStep {...props} />;
  }
}

function askingAbout(draft: OnboardingDraft): string | null {
  if (draft.who === 'self') return t('onboarding.nav.askingAboutSelf');
  if (draft.who === 'other' && draft.name.trim()) {
    return t('onboarding.nav.askingAbout', { name: draft.name.trim() });
  }
  return null;
}

export default function SurveyStepScreen() {
  const params = useLocalSearchParams<{ step: string }>();
  const today = useToday();
  const draft = useOnboardingDraftStore((s) => s.draft);
  const update = useOnboardingDraftStore((s) => s.update);
  const { space } = useTheme();

  const n = parseStepParam(params.step);
  // Deep link / reload without a survey in progress → start from the welcome screen.
  if (!draft) return <Redirect href="/onboarding/welcome" />;
  if (n === null)
    return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: '1' } }} />;

  const step = stepName(n);
  const isLast = n === STEP_COUNT;
  const progress = t('onboarding.nav.progress', { current: n, total: STEP_COUNT });
  const context = askingAbout(draft);
  const hint = HINTS[step];

  const goNext = () => {
    if (!isLast) {
      router.push({ pathname: '/onboarding/[step]', params: { step: String(n + 1) } });
      return;
    }
    const latest = useOnboardingDraftStore.getState().draft;
    if (!latest) return;
    const profile = completeOnboarding(latest, {
      today,
      selfName: t('profiles.relation.self'),
    });
    if (profile) router.replace('/onboarding/done');
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else if (n > 1)
      router.replace({ pathname: '/onboarding/[step]', params: { step: String(n - 1) } });
    // A relative's survey started from the Family tab — back out to it, not to the welcome.
    else router.replace(draft.forRelative ? '/family' : '/onboarding/welcome');
  };

  const skip = () => {
    update(skipPatch(step));
    goNext();
  };

  return (
    <Screen
      footer={
        <Button
          label={isLast ? t('onboarding.nav.finish') : t('onboarding.nav.next')}
          onPress={goNext}
          disabled={!canContinue(step, draft, today)}
          fullWidth
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Button variant="ghost" label={t('onboarding.nav.back')} onPress={goBack} />
        <Text variant="caption" tone="textMuted">
          {progress}
        </Text>
      </View>
      <ProgressBar value={n / STEP_COUNT} accessibilityLabel={progress} />
      {context && (
        <Text variant="caption" tone="textMuted">
          {context}
        </Text>
      )}
      <Text variant="title" accessibilityRole="header">
        {t(`onboarding.steps.${step}.title`)}
      </Text>
      {hint && <Text tone="textMuted">{t(hint)}</Text>}
      <StepBody step={step} draft={draft} update={update} today={today} />
      {isSkippable(step) && (
        <Button variant="ghost" label={t('onboarding.nav.dontKnow')} onPress={skip} />
      )}
    </Screen>
  );
}
