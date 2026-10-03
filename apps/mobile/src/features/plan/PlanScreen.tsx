import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { activityTip, getExamRule } from '@naczas/rules';

import { Button } from '@/components/Button';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { successHaptic } from '@/components/haptics';
import { Plate } from '@/components/Plate';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { QueueNumber } from '@/components/QueueNumber';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { t } from '@/i18n';
import { useRecordsStore } from '@/store';
import { useTheme } from '@/theme';

import { ActivityCard } from './ActivityCard';
import { NotificationPrompt } from './NotificationPrompt';
import {
  countActNow,
  groupSections,
  isCollapsedByDefault,
  planCta,
  ticketContent,
  ticketItem,
  type CtaAction,
  type Message,
} from './plan-view-model';
import { PlanRow } from './PlanRow';
import { PlanSection } from './PlanSection';
import { ReminderBanner } from './ReminderBanner';
import { UrgentCountProbe } from './UrgentCountProbe';
import { usePlanData } from './use-plan-data';
import { VisitPrepCard } from './VisitPrepCard';

const openExam = (examId: string) =>
  router.push({ pathname: '/exam/[examId]', params: { examId } });

const msg = (m: Message) => t(m.key, m.params);

// The number slides in on the first plan visit of the session only, not on every tab switch.
const session = { heroAnimated: false };

interface DoneToast {
  profileId: string;
  examId: string;
  name: string;
}

export default function PlanScreen() {
  const { colors, space, borderWidth, seniorMode } = useTheme();
  const { profiles, activeProfile, plan, waitTimes, today, selectProfile } = usePlanData();
  const markDone = useRecordsStore((s) => s.markDone);
  const undo = useRecordsStore((s) => s.undo);
  const [doneToast, setDoneToast] = useState<DoneToast | null>(null);
  const hideToast = useCallback(() => setDoneToast(null), []);
  const [animateHero] = useState(() => !session.heroAnimated);
  useEffect(() => {
    session.heroAnimated = true;
  }, []);
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
  const actNow = countActNow(plan.items);
  const hero = ticketItem(plan.items);
  const sections = groupSections(plan.items.filter((i) => i !== hero));

  const runCta = (action: CtaAction, examId: string) => {
    switch (action) {
      case 'facilities':
        router.push({ pathname: '/exam/[examId]/facilities', params: { examId } });
        return;
      case 'exam':
        openExam(examId);
        return;
      case 'markDone':
        // Done right here (M3 M6): the row moves to "Zrobione" and the toast offers undo.
        markDone(activeProfile.id, examId, today);
        successHaptic();
        setDoneToast({ profileId: activeProfile.id, examId, name: getExamRule(examId).name });
    }
  };

  const heroView = (() => {
    if (!hero) return null;
    const rule = getExamRule(hero.examId);
    const summary = waitTimes[hero.examId];
    const content = ticketContent(hero, rule.booking, summary, today);
    const cta = planCta(hero, rule.booking, true, summary);
    const km = summary?.radiusKm;
    const unit = msg(content.unit);
    return (
      <View style={{ gap: space.md }}>
        <QueueNumber
          title={rule.name}
          status={t(`plan.ticket.status.${hero.urgency === 'act_now' ? 'act_now' : 'this_year'}`)}
          tone={hero.urgency}
          value={content.value}
          unit={km != null ? `${unit} · ${t('plan.ticket.radius', { km })}` : unit}
          valueA11y={[msg(content.a11yValue), km != null && t('plan.ticket.radiusA11y', { km })]
            .filter(Boolean)
            .join(', ')}
          animateIn={animateHero}
          onPress={() => openExam(hero.examId)}
          accessibilityHint={t('plan.ticket.a11yHint')}
        />
        <Text>{msg(content.message)}</Text>
        {cta && (
          <Button
            label={msg(cta.label)}
            accessibilityLabel={
              cta.label.key === 'plan.cta.findSlot'
                ? t('plan.cta.findSlotA11y', {
                    name: rule.name,
                    weeks: Number(cta.label.params?.weeks ?? 0),
                  })
                : t('plan.cta.a11ySuffix', { label: msg(cta.label), name: rule.name })
            }
            fullWidth
            onPress={() => runCta(cta.action, hero.examId)}
          />
        )}
      </View>
    );
  })();

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

  const divider = {
    borderTopWidth: borderWidth.strong,
    borderTopColor: colors.text,
    paddingTop: space.md,
  };

  return (
    <Screen wall edges={['top', 'left', 'right']} footer={toast || undefined}>
      {profiles
        .filter((p) => p.id !== activeProfile.id)
        .map((p) => (
          <UrgentCountProbe key={p.id} profileId={p.id} onCount={reportUrgent} />
        ))}

      <View style={{ gap: space.xs }}>
        <Text
          variant="display"
          color={colors.onWall}
          accessibilityRole="header"
          accessibilityLabel={t('plan.titleFor', { name: activeProfile.name })}
        >
          {t('plan.title')}
        </Text>
        {actNow === 0 && <Text color={colors.onWall}>{t('plan.summary.none')}</Text>}
      </View>

      <View>
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
        <Plate tabbed={profiles.length > 0} style={{ marginTop: -borderWidth.plate }}>
          {/* Native gets OS notifications (NotificationSync in the root layout); web gets a line. */}
          {Platform.OS === 'web' && <ReminderBanner plan={plan} />}

          {heroView}

          {!hero && sections.length === 0 && (
            <EmptyState title={t('plan.empty.title')} body={t('plan.empty.body')} />
          )}

          {sections.map((section) => (
            <PlanSection
              key={section.urgency}
              urgency={section.urgency}
              count={section.items.length}
              collapsible={section.urgency === 'done' || section.urgency === 'later'}
              initiallyCollapsed={isCollapsedByDefault(section.urgency, seniorMode)}
            >
              {section.items.map((item) => {
                const rule = getExamRule(item.examId);
                const cta = item.urgency === 'booked' ? planCta(item, rule.booking, false) : null;
                return (
                  <PlanRow
                    key={item.examId}
                    item={item}
                    rule={rule}
                    today={today}
                    waitTime={waitTimes[item.examId]}
                    onOpen={openExam}
                    cta={
                      cta
                        ? {
                            label: msg(cta.label),
                            accessibilityLabel: t('plan.cta.a11ySuffix', {
                              label: msg(cta.label),
                              name: rule.name,
                            }),
                            onPress: () => runCta(cta.action, item.examId),
                          }
                        : undefined
                    }
                  />
                );
              })}
            </PlanSection>
          ))}

          {(hero || sections.length > 0) && (
            <View style={[divider, { gap: space.md }]}>
              <VisitPrepCard />
              <NotificationPrompt />
            </View>
          )}

          {tip && (
            <View style={divider}>
              <ActivityCard tip={tip} />
            </View>
          )}

          <Disclaimer text={t('plan.disclaimer')} />
        </Plate>
      </View>
    </Screen>
  );
}
