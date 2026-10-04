import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { activityTip, getExamRule } from '@naczas/rules';

import { Button } from '@/components/Button';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { successHaptic } from '@/components/haptics';
import { IconButton } from '@/components/IconButton';
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
import { BetEntry } from './BetEntry';
import { NotificationPrompt } from './NotificationPrompt';
import {
  isCollapsedByDefault,
  planCta,
  planLayout,
  queueWaitWeeks,
  ticketContent,
  type CtaAction,
  type Message,
  type PlanSection as PlanSectionData,
} from './plan-view-model';
import { PlanRow } from './PlanRow';
import { PlanSection } from './PlanSection';
import { ReminderBanner } from './ReminderBanner';
import { UnknownHistorySection } from './UnknownHistorySection';
import { UrgentCountProbe } from './UrgentCountProbe';
import { usePlanData } from './use-plan-data';
import { useUnknownExamIds } from './use-unknown-exam-ids';
import { VisitPrepCard } from './VisitPrepCard';

const openExam = (examId: string) =>
  router.push({ pathname: '/exam/[examId]', params: { examId } });

const msg = (m: Message) => t(m.key, m.params);

// The number slides in on the first plan visit of the session only, not on every tab switch.
const session = { heroAnimated: false };

// With the ticket above it, "Teraz" shows at most three exams before "Pokaż jeszcze N".
const ACT_NOW_ROWS = 2;
const NO_ITEMS: never[] = [];

/** Undo toast after "Zrobione" or a "Kiedy ostatnio?" answer — both revert via records.undo. */
interface UndoToast {
  profileId: string;
  examId: string;
  name: string;
  message: string;
}

export default function PlanScreen() {
  const { colors, layout, space, borderWidth, seniorMode } = useTheme();
  const { profiles, activeProfile, plan, waitTimes, today, selectProfile } = usePlanData();
  const markDone = useRecordsStore((s) => s.markDone);
  const undo = useRecordsStore((s) => s.undo);
  const [doneToast, setDoneToast] = useState<UndoToast | null>(null);
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
  const unknownIds = useUnknownExamIds(activeProfile?.id ?? '', plan?.items ?? NO_ITEMS);

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
  const {
    hero,
    unknown,
    sections,
    actNowCount: actNow,
  } = planLayout(plan.items, unknownIds, (examId) =>
    getExamRule(examId).booking === 'queue' ? queueWaitWeeks(waitTimes[examId]) : null,
  );
  // The unknown group sits after what is already in motion (Teraz, Umówione), before the future.
  const isInMotion = (s: PlanSectionData) => s.urgency === 'act_now' || s.urgency === 'booked';

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
        setDoneToast({
          profileId: activeProfile.id,
          examId,
          name: getExamRule(examId).name,
          message: t('exam.toast.markedDone'),
        });
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
        <Text variant="bodyLarge">{msg(content.message)}</Text>
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
      message={doneToast.message}
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

  const renderSection = (section: PlanSectionData) => (
    <PlanSection
      key={section.urgency}
      urgency={section.urgency}
      count={section.items.length}
      collapsible={section.urgency === 'done' || section.urgency === 'later'}
      initiallyCollapsed={isCollapsedByDefault(section.urgency, seniorMode)}
      limit={section.urgency === 'act_now' ? ACT_NOW_ROWS : undefined}
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
  );

  // Ink rules belong to the urgency sections; the trailing extras get a hairline and more air,
  // so they read as secondary to the plan instead of as more sections.
  const divider = {
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.border,
    // Plate already spaces children by space.md; top it up to a full section gap.
    marginTop: layout.sectionGap - space.md,
    paddingTop: layout.sectionGap,
  };

  return (
    <Screen wall edges={['top', 'left', 'right']} footer={toast || undefined}>
      {profiles
        .filter((p) => p.id !== activeProfile.id)
        .map((p) => (
          <UrgentCountProbe key={p.id} profileId={p.id} onCount={reportUrgent} />
        ))}

      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <View style={{ gap: space.xs }}>
          <Text
            variant="display"
            color={colors.onWall}
            accessibilityRole="header"
            accessibilityLabel={t('plan.titleFor', { name: activeProfile.name })}
          >
            {t('plan.title')}
          </Text>
          {actNow === 0 && unknown.length === 0 && (
            <Text color={colors.onWall}>{t('plan.summary.none')}</Text>
          )}
        </View>
        <IconButton
          icon="people"
          accessibilityLabel="Konto rodzinne i logowanie"
          onPress={() => router.push('/login')}
        />
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

          {!hero && sections.length === 0 && unknown.length === 0 && (
            <EmptyState title={t('plan.empty.title')} body={t('plan.empty.body')} />
          )}

          {sections.filter(isInMotion).map(renderSection)}

          {unknown.length > 0 && (
            <UnknownHistorySection
              items={unknown}
              profile={activeProfile}
              today={today}
              onOpen={openExam}
              onAnswered={(examId) => {
                const name = getExamRule(examId).name;
                setDoneToast({
                  profileId: activeProfile.id,
                  examId,
                  name,
                  message: t('plan.unknown.saved', { name }),
                });
              }}
            />
          )}

          {sections.filter((s) => !isInMotion(s)).map(renderSection)}

          {(hero || sections.length > 0 || unknown.length > 0) && (
            <View style={[divider, { gap: space.md }]}>
              <VisitPrepCard />
              <BetEntry profileId={activeProfile.id} />
              <NotificationPrompt />
            </View>
          )}

          {tip && (
            <View style={divider}>
              <ActivityCard tip={tip} />
            </View>
          )}

          <View style={divider}>
            <Button
              variant="secondary"
              icon="plus"
              label={t('plan.addCustom')}
              onPress={() => router.push('/exam/custom')}
              fullWidth
            />
          </View>

          <Disclaimer text={t('plan.disclaimer')} />
        </Plate>
      </View>
    </Screen>
  );
}
