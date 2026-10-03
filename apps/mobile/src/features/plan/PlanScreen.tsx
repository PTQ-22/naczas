import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { activityTip, getExamRule } from '@naczas/rules';

import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { ActivityCard } from './ActivityCard';
import { ExamCard } from './ExamCard';
import {
  countActNow,
  groupSections,
  isCollapsedByDefault,
  summaryMessage,
  type CtaAction,
} from './plan-view-model';
import { PlanTimelineSection } from './PlanTimelineSection';
import { usePlanData } from './use-plan-data';

const openExam = (examId: string) =>
  router.push({ pathname: '/exam/[examId]', params: { examId } });

function handleCta(action: CtaAction, examId: string) {
  switch (action) {
    case 'facilities':
      router.push({ pathname: '/exam/[examId]/facilities', params: { examId } });
      return;
    case 'exam':
    case 'markDone':
      // TODO(WS3-5): markDone should call the records store; until it exists the exam screen
      // is where the user confirms it.
      openExam(examId);
  }
}

export default function PlanScreen() {
  const { motion, layout, space, seniorMode } = useTheme();
  const { profiles, activeProfile, plan, today } = usePlanData();
  const tip = activityTip(activeProfile, today);
  const sections = groupSections(plan.items);
  const actNow = countActNow(plan.items);
  const summary = summaryMessage(actNow);
  const firstActNowId = plan.items.find((i) => i.urgency === 'act_now')?.examId;
  let cardIndex = 0;

  return (
    <Screen edges={['top', 'left', 'right']}>
      {profiles.length > 0 && (
        <ProfileSwitcher
          profiles={profiles.map((p) => ({
            id: p.id,
            name: p.name,
            urgentCount: p.id === activeProfile.id ? actNow : 0,
          }))}
          activeId={activeProfile.id}
          // TODO(WS3): setActiveProfileId from the store.
          onSelect={() => undefined}
          onAdd={() => router.push('/family')}
        />
      )}

      <View style={{ gap: space.xs, paddingBottom: layout.sectionGap / 2 }}>
        <Text variant="title" accessibilityRole="header">
          {t('plan.titleFor', { name: activeProfile.name })}
        </Text>
        <Text variant="bodyLarge" tone="textMuted">
          {t(summary.key, summary.params)}
        </Text>
      </View>

      {sections.length === 0 ? (
        <EmptyState title={t('plan.empty.title')} body={t('plan.empty.body')} />
      ) : (
        <View>
          {sections.map((section, sectionIndex) => (
            <PlanTimelineSection
              key={section.urgency}
              urgency={section.urgency}
              count={section.items.length}
              collapsible={section.urgency === 'done' || section.urgency === 'later'}
              initiallyCollapsed={isCollapsedByDefault(section.urgency, seniorMode)}
              isLast={sectionIndex === sections.length - 1}
            >
              {section.items.map((item) => {
                const delay = cardIndex++ * motion.stagger;
                return (
                  <Animated.View
                    key={item.examId}
                    // Subtle entrance; ReduceMotion.System skips it when the OS asks for less motion.
                    entering={FadeInDown.duration(motion.base)
                      .delay(delay)
                      .reduceMotion(ReduceMotion.System)}
                  >
                    <ExamCard
                      item={item}
                      rule={getExamRule(item.examId)}
                      isFirstActNow={item.examId === firstActNowId}
                      onOpen={openExam}
                      onCta={handleCta}
                    />
                  </Animated.View>
                );
              })}
            </PlanTimelineSection>
          ))}
        </View>
      )}

      {tip && <ActivityCard tip={tip} />}

      <Disclaimer text={t('plan.disclaimer')} />
    </Screen>
  );
}
