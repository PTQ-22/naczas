import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { rules } from '@naczas/rules';
import { ISODateSchema } from '@naczas/shared';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { successHaptic } from '@/components/haptics';
import { Icon, type IconName } from '@/components/Icon';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { selectActiveProfile, useCallTasksStore, useProfilesStore, useToday } from '@/store';
import { selectSlots, useAvailabilityStore } from '@/store/availability-store';
import { fonts, useTheme } from '@/theme';

import { toCallAvailability } from './availability';
import { AvailabilityCard } from './AvailabilityCard';
import { buildCallRequest, inSentence } from './call-request';
import { cancelTask, retryTaskNow, startCallTask } from './call-tasks';
import { CallStats } from './CallStats';
import { taskStatusLine } from './task-status';
import { Transcript } from './Transcript';

function Point({ icon, text }: { icon: IconName; text: string }) {
  const { space, colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
      <Icon name={icon} size="sm" color={colors.primary} />
      <Text style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}

/** Re-renders every second while `on` — for the "ponowię za 7:42" countdown. */
function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);
  return now;
}

type StartState = 'idle' | 'starting' | 'error';

/**
 * "Zadzwoń za mnie": consent + calendar, then the live view of the agent's task. The task itself
 * lives in the call-tasks store and is polled app-wide (CallTasksSync), so closing this screen
 * doesn't stop the agent — it keeps calling, re-dialling and books the plan.
 */
export default function CallAssistScreen() {
  const params = useLocalSearchParams<{
    examId: string;
    facility?: string;
    firstDate?: string;
  }>();
  const { examId } = params;
  const { space, colors, type } = useTheme();
  const today = useToday();
  const patient = useProfilesStore(selectActiveProfile);
  const slots = useAvailabilityStore(selectSlots(patient?.id));
  // URL params are external input (AGENTS.md §3).
  const parsedFirstDate = ISODateSchema.safeParse(params.firstDate);
  const nearest =
    parsedFirstDate.success && parsedFirstDate.data >= today ? parsedFirstDate.data : null;
  const profiles = useProfilesStore((s) => s.profiles);
  const rule = rules.find((r) => r.id === examId);

  const [taskId, setTaskId] = useState<string | undefined>();
  const [start, setStart] = useState<StartState>('idle');
  const [busy, setBusy] = useState(false);
  const task = useCallTasksStore((s) =>
    taskId ? s.tasks.find((x) => x.id === taskId) : undefined,
  );
  const now = useNow(task?.status === 'retry_scheduled');

  const facilityName = task?.facilityName ?? params.facility ?? '';
  const bookedDate = task?.result?.booked ? task.result.date : null;

  const celebrated = useRef(false);
  useEffect(() => {
    if (bookedDate && !celebrated.current) {
      celebrated.current = true;
      successHaptic();
    }
  }, [bookedDate]);

  if (!rule || !patient) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState icon="info" title={t('exam.notFound.title')} />
      </Screen>
    );
  }

  const call = async () => {
    setStart('starting');
    try {
      const id = await startCallTask({
        request: buildCallRequest({
          patient,
          profiles,
          rule,
          facilityName,
          availability: toCallAvailability(slots, today),
        }),
        profileId: patient.id,
        examId: rule.id,
        facilityName,
      });
      celebrated.current = false;
      setTaskId(id);
      setStart('idle');
    } catch {
      setStart('error');
    }
  };
  // Button handlers are sync; the async work runs detached and only toggles `busy`.
  const act = (run: () => Promise<void>) => () => {
    setBusy(true);
    run()
      .catch(() => undefined) // the status stays as it was; the poller keeps it fresh
      .finally(() => setBusy(false));
  };
  const toManual = () =>
    router.replace({ pathname: '/exam/[examId]/book', params: { examId, facility: facilityName } });

  const footer = (() => {
    if (!task) {
      return (
        <View style={{ gap: space.xs }}>
          <Button
            label={start === 'error' ? t('callAssist.retry') : t('callAssist.start')}
            accessibilityLabel={t('callAssist.startA11y')}
            icon="phone"
            fullWidth
            loading={start === 'starting'}
            onPress={() => void call()}
          />
        </View>
      );
    }
    if (bookedDate) {
      return (
        <View style={{ gap: space.xs }}>
          <Button label={t('callAssist.done')} fullWidth onPress={() => router.back()} />
          <Button label={t('callAssist.fixDate')} variant="ghost" fullWidth onPress={toManual} />
        </View>
      );
    }
    if (task.status === 'retry_scheduled') {
      return (
        <View style={{ gap: space.xs }}>
          <Button
            testID="call-retry-now"
            label={t('callAssist.retryNow')}
            icon="phone"
            fullWidth
            loading={busy}
            onPress={act(() => retryTaskNow(task.id))}
          />
          <Button
            testID="call-cancel"
            label={t('callAssist.cancel')}
            variant="ghost"
            fullWidth
            disabled={busy}
            onPress={act(() => cancelTask(task.id))}
          />
        </View>
      );
    }
    if (task.closed) {
      return (
        <View style={{ gap: space.xs }}>
          <Button
            label={t('callAssist.retry')}
            icon="phone"
            fullWidth
            onPress={() => {
              setTaskId(undefined);
              void call();
            }}
          />
          <Button label={t('callAssist.manual')} variant="ghost" fullWidth onPress={toManual} />
        </View>
      );
    }
    // Ringing / on hold / talking: the agent works in the background, the user can leave.
    return (
      <View style={{ gap: space.xs }}>
        <Button label={t('callAssist.background')} fullWidth onPress={() => router.back()} />
        <Button
          testID="call-cancel"
          label={t('callAssist.cancel')}
          variant="ghost"
          fullWidth
          disabled={busy}
          onPress={act(() => cancelTask(task.id))}
        />
      </View>
    );
  })();

  return (
    <Screen edges={['left', 'right', 'bottom']} footer={footer}>
      {!task ? (
        <View style={{ gap: space.lg }}>
          <View style={{ gap: space.xs }}>
            <Text variant="eyebrow" tone="textMuted">
              {t('callAssist.eyebrow')}
            </Text>
            <Text variant="title" accessibilityRole="header">
              {t('callAssist.heading')}
            </Text>
          </View>
          <Text variant="bodyLarge">
            {t('callAssist.intro', { facility: facilityName, exam: inSentence(rule.name) })}
          </Text>
          <View style={{ gap: space.md }}>
            <Point icon="info" text={t('callAssist.points.disclosure')} />
            <Point icon="time" text={t('callAssist.points.retry')} />
            <Point icon="check" text={t('callAssist.points.privacy')} />
            <Point icon="phone" text={t('callAssist.points.demo')} />
          </View>
          {start === 'error' && (
            <Text tone="danger" accessibilityRole="alert">
              {t('callAssist.error')}
            </Text>
          )}
          <AvailabilityCard examId={examId} slots={slots} today={today} nearest={nearest} />
        </View>
      ) : (
        <View style={{ gap: space.lg }}>
          {bookedDate ? (
            <Plate>
              <View
                accessible
                accessibilityLabel={t('callAssist.booked.a11y', {
                  date: format(parseISO(bookedDate), 'd MMMM yyyy', { locale: pl }),
                })}
                style={{ gap: space.xs }}
              >
                <Text variant="eyebrow" color={colors.urgency.booked.fg}>
                  {t('callAssist.booked.eyebrow')}
                </Text>
                <Text
                  variant="ticket"
                  tabular
                  color={colors.urgency.booked.fg}
                  style={{ fontFamily: fonts.monoBold }}
                >
                  {format(parseISO(bookedDate), 'dd.MM')}
                </Text>
                <Text variant="label">
                  {task.result?.time
                    ? t('callAssist.booked.when', {
                        weekday: format(parseISO(bookedDate), 'EEEE', { locale: pl }),
                        time: task.result.time,
                      })
                    : t('callAssist.booked.whenNoTime', {
                        weekday: format(parseISO(bookedDate), 'EEEE', { locale: pl }),
                      })}
                </Text>
                <Text tone="textMuted">{`${rule.name} · ${facilityName}`}</Text>
              </View>
              <Text>{t('callAssist.booked.saved')}</Text>
              {task.result?.note ? <Text tone="textMuted">{task.result.note}</Text> : null}
              <CallStats stats={task.stats} />
            </Plate>
          ) : (
            <View style={{ gap: space.xs }} accessibilityLiveRegion="polite">
              <Text
                variant="heading"
                testID="call-status"
                style={{ fontFamily: fonts.monoBold, fontSize: type.heading.fontSize }}
              >
                {taskStatusLine(task, now).toUpperCase()}
              </Text>
              <CallStats stats={task.stats} />
              {task.status === 'failed' && <Text>{t('callAssist.failed.body')}</Text>}
              {task.status === 'cancelled' && <Text>{t('callAssist.cancelledBody')}</Text>}
              {task.closed && task.status === 'ended' && (
                <>
                  <Text variant="label">{t('callAssist.notBooked.title')}</Text>
                  <Text>{t('callAssist.notBooked.body')}</Text>
                </>
              )}
            </View>
          )}
          <Transcript lines={task.transcript} />
        </View>
      )}
    </Screen>
  );
}
