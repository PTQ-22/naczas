import { createURL } from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import { z } from 'zod';

import { rules } from '@naczas/rules';

import { Accordion } from '@/components/Accordion';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { successHaptic } from '@/components/haptics';
import { Icon } from '@/components/Icon';
import { Plate } from '@/components/Plate';
import { QueueNumber } from '@/components/QueueNumber';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { pluralForm } from '@/features/plan/plan-view-model';
import { usePlanData } from '@/features/plan/use-plan-data';
import { t } from '@/i18n';
import { useRecordsStore } from '@/store';
import { useTheme } from '@/theme';

import { addToCalendar } from './add-to-calendar';
import { buildCalendarEvent } from './calendar-event';
import {
  examCtas,
  examStep,
  frequencyMessage,
  queueInfo,
  referralText,
  timingMessages,
  type ExamAction,
  type Message,
} from './exam-view-model';
import { ExamProgress } from './ExamProgress';

import type { ReactNode } from 'react';

const msg = (m: Message) => t(m.key, m.params);

// URL params are external input (AGENTS.md §3): validate before touching rules.
const ParamsSchema = z.object({ examId: z.string().min(1) });

/** Plain-text section on the plate: ink rule + mono eyebrow, no card (redesign §4). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, space, borderWidth } = useTheme();
  return (
    <View
      style={{
        gap: space.sm,
        paddingTop: space.md,
        borderTopWidth: borderWidth.strong,
        borderTopColor: colors.text,
      }}
    >
      <Text variant="eyebrow" tone="textMuted" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function ExamScreen() {
  const { colors, space } = useTheme();
  const params = ParamsSchema.safeParse(useLocalSearchParams());
  const { activeProfile, plan, waitTimes, today } = usePlanData();
  const markDone = useRecordsStore((s) => s.markDone);
  const undo = useRecordsStore((s) => s.undo);
  const intervalOverrides = useRecordsStore((s) => s.intervalOverrides);
  const setIntervalOverride = useRecordsStore((s) => s.setIntervalOverride);
  // Profile the last "done" was recorded for — the toast's undo must target that one.
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const hideToast = useCallback(() => setDoneFor(null), []);
  const [notice, setNotice] = useState<string | null>(null);
  const hideNotice = useCallback(() => setNotice(null), []);

  const examId = params.success ? params.data.examId : undefined;
  const rule = rules.find((r) => r.id === examId);

  if (!rule) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState icon="info" title={t('exam.notFound.title')} body={t('exam.notFound.body')} />
      </Screen>
    );
  }

  const item = plan?.items.find((i) => i.examId === rule.id);
  // Not in this person's plan (e.g. deep link while another profile is active): say so plainly
  // instead of a misleading "no queue data", and don't push booking actions (M3 L6).
  const notRecommended = Boolean(activeProfile) && !item;
  const currentInterval = activeProfile
    ? ((intervalOverrides as Record<string, number> | undefined)?.[
        `${activeProfile.id}|${rule.id}`
      ] ?? rule.intervalMonths)
    : rule.intervalMonths;
  const queue = notRecommended ? null : queueInfo(rule, waitTimes[rule.id]);
  const ctas = notRecommended ? {} : examCtas(rule, item);
  // Queue exams that also have a no-referral programme (colonoscopy): the wait times are NFZ
  // clinic (AOS) queues, not the programme — say so and link the programme (WS1, M3 L5).
  const programUrl = rule.programUrl;
  const showProgramNote = queue !== null && Boolean(programUrl);
  const referral = referralText(rule);
  const palette = item ? colors.urgency[item.urgency] : undefined;
  const step = notRecommended ? null : examStep(item);

  const run = (action: ExamAction) => {
    switch (action) {
      case 'facilities':
        router.push({ pathname: '/exam/[examId]/facilities', params: { examId: rule.id } });
        return;
      case 'program':
        if (rule.programUrl) void Linking.openURL(rule.programUrl);
        else router.push({ pathname: '/exam/[examId]/facilities', params: { examId: rule.id } });
        return;
      case 'book':
        router.push({ pathname: '/exam/[examId]/book', params: { examId: rule.id } });
        return;
      case 'markDone':
        if (!activeProfile) return;
        // Stay on the screen: the card flips to "done / next around …" — the demo loop's payoff.
        markDone(activeProfile.id, rule.id, today);
        successHaptic();
        setDoneFor(activeProfile.id);
    }
  };

  const addEvent = async () => {
    if (!item || !activeProfile) return;
    const draft = buildCalendarEvent({
      item,
      examName: rule.name,
      profileName: activeProfile.name,
      link: createURL(`exam/${rule.id}`),
      today,
    });
    const result = await addToCalendar(draft);
    if (result === 'canceled') return;
    if (result === 'saved') successHaptic();
    setDoneFor(null);
    setNotice(t(`exam.calendar.${result}`));
  };

  const { primary, ghost } = ctas;
  const toast = doneFor ? (
    <Toast
      message={t('exam.toast.markedDone')}
      action={{
        label: t('exam.toast.undo'),
        accessibilityLabel: t('exam.toast.undoA11y', { name: rule.name }),
        onPress: () => {
          undo(doneFor, rule.id);
          setDoneFor(null);
        },
      }}
      onHide={hideToast}
    />
  ) : notice ? (
    <Toast message={notice} onHide={hideNotice} />
  ) : null;
  const footer =
    toast || primary || ghost ? (
      <>
        {toast}
        {primary && (
          <Button label={msg(primary.label)} onPress={() => run(primary.action)} fullWidth />
        )}
        {ghost && (
          <Button
            variant="ghost"
            label={msg(ghost.label)}
            onPress={() => run(ghost.action)}
            fullWidth
          />
        )}
      </>
    ) : undefined;

  return (
    <Screen wall edges={['left', 'right', 'bottom']} footer={footer}>
      <Plate>
        <View style={{ gap: space.sm }}>
          {step ? (
            <ExamProgress step={step} />
          ) : (
            item && (
              <Text variant="eyebrow" color={palette?.fg}>
                {t(`plan.urgency.${item.urgency}`)}
              </Text>
            )
          )}
          <Text variant="display" accessibilityRole="header">
            {rule.name}
          </Text>
          {item &&
            timingMessages(item, today).map((m, i) => (
              <Text key={m.key} variant="bodyLarge" color={i === 1 ? palette?.fg : undefined}>
                {msg(m)}
              </Text>
            ))}
          {item && !notRecommended && (
            <Button
              variant="ghost"
              icon="calendar"
              label={t('exam.calendar.add')}
              accessibilityLabel={t('exam.calendar.addA11y', { exam: rule.name })}
              onPress={() => void addEvent()}
            />
          )}
        </View>

        {notRecommended && activeProfile && (
          <View accessible style={{ flexDirection: 'row', gap: space.sm }}>
            <Icon name="info" size="sm" color={colors.textMuted} />
            <Text style={{ flex: 1 }}>
              {t('exam.notRecommended', { name: activeProfile.name })}
            </Text>
          </View>
        )}

        {queue?.weeks !== undefined && queue.lines.label && (
          <QueueNumber
            size="compact"
            title={msg(queue.lines.label)}
            tone={item?.urgency ?? 'later'}
            value={String(queue.weeks)}
            unit={t(`plan.ticket.weeks.${pluralForm(queue.weeks)}`)}
            valueA11y={t(`plan.ticket.weeksA11y.${pluralForm(queue.weeks)}`, {
              weeks: queue.weeks,
            })}
          />
        )}
        {queue && !queue.hasData && queue.lines.label && (
          <Text tone="textMuted">{msg(queue.lines.label)}</Text>
        )}
        {(showProgramNote || queue?.lines.meta) && (
          <View style={{ gap: space.xs }}>
            {showProgramNote && (
              <Text variant="caption" tone="textMuted">
                {t('exam.queue.clinicNote')}
              </Text>
            )}
            {queue?.lines.meta && (
              <Text variant="caption" tone="textSubtle">
                {msg(queue.lines.meta)}
              </Text>
            )}
          </View>
        )}
        {showProgramNote && programUrl && (
          <Button
            variant="ghost"
            icon="external"
            accessibilityRole="link"
            label={t('exam.queue.programLink')}
            accessibilityLabel={t('exam.queue.programLinkA11y')}
            onPress={() => void Linking.openURL(programUrl)}
          />
        )}

        {item && item.reasons.length > 0 && (
          <Section title={t('exam.section.why')}>
            {item.reasons.map((reason) => (
              <Text key={reason}>{`• ${reason}`}</Text>
            ))}
          </Section>
        )}

        <Section title={t('exam.section.about')}>
          <Text>{rule.description}</Text>
        </Section>

        <Section title={t('exam.section.frequency')}>
          <Text>{msg(frequencyMessage(currentInterval))}</Text>
          {activeProfile && (
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
              <Button
                variant="ghost"
                icon="minus"
                label="- 1m"
                onPress={() =>
                  setIntervalOverride(activeProfile.id, rule.id, Math.max(1, currentInterval - 1))
                }
              />
              <Button
                variant="ghost"
                icon="plus"
                label="+ 1m"
                onPress={() => setIntervalOverride(activeProfile.id, rule.id, currentInterval + 1)}
              />
              {currentInterval !== rule.intervalMonths && (
                <Button
                  variant="ghost"
                  label="Reset"
                  onPress={() => setIntervalOverride(activeProfile.id, rule.id, null)}
                />
              )}
            </View>
          )}
          {!rule.verified && <Chip tone="later" icon="info" label={t('exam.approximate')} />}
        </Section>

        <Section title={t('exam.section.referral')}>
          <Text>{typeof referral === 'string' ? referral : msg(referral)}</Text>
          {/* Always reachable (M3 H2): even without a referral the GP visit summary is useful. */}
          <Button
            variant="ghost"
            icon="chevronRight"
            label={t(rule.referral ? 'exam.referral.prepareRequest' : 'exam.referral.prepareVisit')}
            onPress={() => router.push('/visit-prep')}
          />
        </Section>

        {rule.prepTips && rule.prepTips.length > 0 && (
          <Accordion title={t('exam.section.prep')}>
            {rule.prepTips.map((tip) => (
              <Text key={tip}>{`• ${tip}`}</Text>
            ))}
          </Accordion>
        )}

        <Button
          variant="ghost"
          icon="external"
          accessibilityRole="link"
          label={t('exam.source', { name: rule.source.name })}
          accessibilityLabel={t('exam.sourceA11y', { name: rule.source.name })}
          onPress={() => void Linking.openURL(rule.source.url)}
        />

        <Disclaimer text={t('exam.disclaimer')} />
      </Plate>
    </Screen>
  );
}
