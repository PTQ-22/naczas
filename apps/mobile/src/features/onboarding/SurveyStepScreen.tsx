import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, Plate, ProgressBar, Screen, Text } from '@/components';
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
  activeSteps,
  canContinue,
  conditionOptions,
  parseStepParam,
  skipLabel,
  skipPatch,
  stepAt,
  type SurveyStep,
} from './survey';

const FAMILY_HISTORY = [
  'colorectal_cancer',
  'breast_cancer',
  'ovarian_cancer',
  'endometrial_cancer',
] as const;

const HINTS: Partial<Record<SurveyStep, MessageKey>> = {
  location: 'onboarding.steps.location.hint',
  conditions: 'onboarding.steps.conditions.hint',
  familyHistory: 'onboarding.steps.familyHistory.hint',
  lastExams: 'onboarding.steps.lastExams.hint',
};

function StepBody({ step, ...props }: StepProps & { step: SurveyStep }) {
  const { draft, update, today } = props;
  switch (step) {
    case 'who':
      return <WhoStep {...props} />;
    case 'basics':
      return <BasicsStep {...props} />;
    case 'location':
      return <LocationStep {...props} />;
    case 'conditions': {
      const options = conditionOptions(draft, today);
      return (
        <>
          <MultiChoiceStep
            options={options.map((value) => ({
              value,
              label: t(`onboarding.steps.conditions.options.${value}`),
              ...(value === 'immunosuppression' && {
                description: t('onboarding.steps.conditions.why.immunosuppression'),
              }),
            }))}
            selected={draft.conditions}
            onToggle={(value) => update({ conditions: toggle(draft.conditions, value) })}
          />
          {options.includes('diabetes') && (
            <Text variant="caption" tone="textMuted">
              {t('onboarding.steps.conditions.chukNote')}
            </Text>
          )}
        </>
      );
    }
    case 'familyHistory':
      return (
        <MultiChoiceStep
          options={FAMILY_HISTORY.map((value) => ({
            value,
            label: t(`onboarding.steps.familyHistory.options.${value}`),
            ...(value === 'colorectal_cancer' && {
              description: t('onboarding.steps.familyHistory.why.colorectal_cancer'),
            }),
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

  // Deep link / reload without a survey in progress → start from the welcome screen.
  if (!draft) return <Redirect href="/onboarding/welcome" />;
  const steps = activeSteps(draft, today);
  const n = parseStepParam(params.step, steps.length);
  if (n === null)
    return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: '1' } }} />;

  const step = stepAt(n, steps);
  const isLast = n === steps.length;
  const progress = t('onboarding.nav.progress', { current: n, total: steps.length });
  const context = askingAbout(draft);
  const hint = HINTS[step];
  const skipKey = skipLabel(step, draft);

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
    if (!profile) return;
    // Straight to the plan — it is the confirmation. Drop the survey steps first so a
    // back swipe can't reopen a step whose draft was just cleared.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/plan');
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else if (n > 1)
      router.replace({ pathname: '/onboarding/[step]', params: { step: String(n - 1) } });
    // A relative's survey started from the Family tab — back out to it, not to the welcome.
    else router.replace(draft.forRelative ? '/family' : '/onboarding/welcome');
  };

  const skip = () => {
    update(skipPatch(step, draft));
    goNext();
  };

  return (
    <Screen
      wall
      footer={
        <Button
          label={isLast ? t('onboarding.nav.finish') : t('onboarding.nav.next')}
          onPress={goNext}
          disabled={!canContinue(step, draft, today)}
          fullWidth
        />
      }
    >
      <Plate>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Button variant="ghost" label={t('onboarding.nav.back')} onPress={goBack} />
          <Text variant="eyebrow" tone="textMuted">
            {progress}
          </Text>
        </View>
        <ProgressBar value={n / steps.length} accessibilityLabel={progress} />
        {/* Always rendered (blank until step 1 is answered) so choosing "for me / relative"
            doesn't shift the options under the user's finger. */}
        <Text
          variant="caption"
          tone="textMuted"
          accessibilityElementsHidden={!context}
          importantForAccessibility={context ? 'auto' : 'no-hide-descendants'}
        >
          {context ?? '\u00a0'}
        </Text>
        <Text variant="display" accessibilityRole="header">
          {t(`onboarding.steps.${step}.title`)}
        </Text>
        {hint && <Text tone="textMuted">{t(hint)}</Text>}
        <StepBody step={step} draft={draft} update={update} today={today} />
        {skipKey && <Button variant="ghost" label={t(skipKey)} onPress={skip} />}
      </Plate>
    </Screen>
  );
}
