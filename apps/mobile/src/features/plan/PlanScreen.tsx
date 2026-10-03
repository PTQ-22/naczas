import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { activityTip, getExamRule } from '@naczas/rules';

import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { t } from '@/i18n';
import { useRecordsStore } from '@/store';
import { useTheme } from '@/theme';

import { ActivityCard } from './ActivityCard';
import { ExamCard } from './ExamCard';
import { NotificationPrompt } from './NotificationPrompt';
import {
  countActNow,
  groupSections,
  isCollapsedByDefault,
  summaryMessage,
  type CtaAction,
} from './plan-view-model';
import { PlanTimelineSection } from './PlanTimelineSection';
import { ReminderBanner } from './ReminderBanner';
import { UrgentCountProbe } from './UrgentCountProbe';
import { usePlanData } from './use-plan-data';
import { VisitPrepCard } from './VisitPrepCard';

const openExam = (examId: string) =>
  router.push({ pathname: '/exam/[examId]', params: { examId } });

interface DoneToast {
  profileId: string;
  examId: string;
  name: string;
}

export default function PlanScreen() {
  const { motion, layout, space, seniorMode } = useTheme();
  const { profiles, activeProfile, plan, waitTimes, today, selectProfile } = usePlanData();
  const markDone = useRecordsStore((s) => s.markDone);
  const undo = useRecordsStore((s) => s.undo);
  const [doneToast, setDoneToast] = useState<DoneToast | null>(null);
  const hideToast = useCallback(() => setDoneToast(null), []);
  const [urgentById, setUrgentById] = useState<Record<string, number>>({});
  const reportUrgent = useCallback(
    (id: string, count: number) =>
      setUrgentById((cur) => (cur[id] === count ? cur : { ...cur, [id]: count })),
    [],
  );

  if (!activeProfile || !plan) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <EmptyState
          icon="people"
          title={t('plan.noProfile.title')}
          body={t('plan.noProfile.body')}
          action={{
            label: t('plan.noProfile.cta'),
            onPress: () => router.push('/onboarding/welcome'),
          }}
        />
      </Screen>
    );
  }

  const tip = activityTip(activeProfile, today);
  const sections = groupSections(plan.items);
  const actNow = countActNow(plan.items);
  const summary = summaryMessage(actNow);
  const firstActNowId = plan.items.find((i) => i.urgency === 'act_now')?.examId;
  let cardIndex = 0;

  const handleCta = (action: CtaAction, examId: string) => {
    switch (action) {
      case 'facilities':
        router.push({ pathname: '/exam/[examId]/facilities', params: { examId } });
        return;
      case 'exam':
        openExam(examId);
        return;
      case 'markDone':
        // Done right here (M3 M6): the card moves to "Zrobione" and the toast offers undo.
        markDone(activeProfile.id, examId, today);
        setDoneToast({ profileId: activeProfile.id, examId, name: getExamRule(examId).name });
    }
  };

  const toast = doneToast && (
    <Toast
      message={t('exam.toast.markedDone')}
      action={{
        label: t('exam.toast.undo'),
        accessibilityLabel: t('exam.toast.undoA11y', { name: doneToast.name }),
        onPress: () => {
          undo(doneToast.profileId, doneToast.examId);
          setDoneToast(null);
        },
      }}
      onHide={hideToast}
    />
  );

  return (
    <Screen edges={['top', 'left', 'right']} footer={toast || undefined}>
      {profiles
        .filter((p) => p.id !== activeProfile.id)
        .map((p) => (
          <UrgentCountProbe key={p.id} profileId={p.id} onCount={reportUrgent} />
        ))}
      {profiles.length > 0 && (
        <ProfileSwitcher
          profiles={profiles.map((p) => ({
            id: p.id,
            name: p.name,
            urgentCount: p.id === activeProfile.id ? actNow : (urgentById[p.id] ?? 0),
          }))}
          activeId={activeProfile.id}
          onSelect={selectProfile}
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

      {/* Native gets OS notifications (NotificationSync in the root layout); web gets a banner. */}
      {Platform.OS === 'web' && <ReminderBanner plan={plan} />}

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
                      waitTime={waitTimes[item.examId]}
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

      {sections.length > 0 && <VisitPrepCard />}
      {sections.length > 0 && <NotificationPrompt />}

      {tip && <ActivityCard tip={tip} />}

      <Disclaimer text={t('plan.disclaimer')} />
    </Screen>
  );
}
