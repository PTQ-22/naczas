import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { rules } from '@naczas/rules';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { cancelTask, retryTaskNow } from '@/features/call-assist/call-tasks';
import { CallStats } from '@/features/call-assist/CallStats';
import { taskStatusLine } from '@/features/call-assist/task-status';
import { Transcript } from '@/features/call-assist/Transcript';
import { t } from '@/i18n';
import { isTaskActive, useCallTasksStore, useProfilesStore } from '@/store';
import { fonts, useTheme } from '@/theme';

function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);
  return now;
}

/**
 * One agent task as its own screen: what was asked, how it ended, the phone time it took and the
 * whole conversation. Opened from "Moje zlecenia" (active or history) — the Agent tab itself
 * stays a short overview.
 */
export default function CallDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { space, colors } = useTheme();
  const task = useCallTasksStore((s) => s.tasks.find((x) => x.id === taskId));
  const remove = useCallTasksStore((s) => s.remove);
  const profiles = useProfilesStore((s) => s.profiles);
  const [busy, setBusy] = useState(false);
  const now = useNow(task?.status === 'retry_scheduled');

  if (!task) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState icon="info" title={t('agent.detail.notFound')} />
      </Screen>
    );
  }

  const exam = rules.find((r) => r.id === task.examId)?.name ?? task.examId;
  const person = profiles.length > 1 ? profiles.find((p) => p.id === task.profileId)?.name : null;
  const booked = task.result?.booked && task.result.date ? task.result : null;
  const active = isTaskActive(task);

  // Button handlers are sync; the async work runs detached and only toggles `busy`.
  const act = (run: () => Promise<void>) => () => {
    setBusy(true);
    run()
      .catch(() => undefined)
      .finally(() => setBusy(false));
  };

  const footer = active ? (
    <View style={{ gap: space.xs }}>
      {task.status === 'retry_scheduled' && (
        <Button
          testID="detail-retry-now"
          icon="phone"
          label={t('callAssist.retryNow')}
          fullWidth
          loading={busy}
          onPress={act(() => retryTaskNow(task.id))}
        />
      )}
      <Button
        testID="detail-cancel"
        variant={task.status === 'retry_scheduled' ? 'ghost' : 'secondary'}
        label={t('callAssist.cancel')}
        fullWidth
        disabled={busy}
        onPress={act(() => cancelTask(task.id))}
      />
    </View>
  ) : (
    <Button
      testID="detail-remove"
      variant="ghost"
      label={t('agent.detail.remove')}
      fullWidth
      onPress={() => {
        router.back();
        remove(task.id);
      }}
    />
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} footer={footer}>
      <Plate>
        <View style={{ gap: space.xs / 2 }}>
          <Text variant="title" accessibilityRole="header">
            {exam}
          </Text>
          <Text tone="textMuted">{task.facilityName}</Text>
          <Text variant="caption" tone="textMuted">
            {[
              person && t('agent.forProfile', { name: person }),
              format(task.createdAt, 'd MMMM, HH:mm', { locale: pl }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        {booked?.date ? (
          <View
            accessible
            accessibilityLabel={t('callAssist.booked.a11y', {
              date: format(parseISO(booked.date), 'd MMMM yyyy', { locale: pl }),
            })}
            style={{ gap: space.xs / 2 }}
          >
            <Text variant="eyebrow" color={colors.urgency.done.fg}>
              {t('callAssist.booked.eyebrow')}
            </Text>
            <Text
              variant="display"
              tabular
              color={colors.urgency.done.fg}
              style={{ fontFamily: fonts.monoBold }}
            >
              {format(parseISO(booked.date), 'dd.MM')}
            </Text>
            <Text variant="label">
              {booked.time
                ? t('callAssist.booked.when', {
                    weekday: format(parseISO(booked.date), 'EEEE', { locale: pl }),
                    time: booked.time,
                  })
                : t('callAssist.booked.whenNoTime', {
                    weekday: format(parseISO(booked.date), 'EEEE', { locale: pl }),
                  })}
            </Text>
            {booked.note ? <Text tone="textMuted">{booked.note}</Text> : null}
          </View>
        ) : (
          <Text
            variant="heading"
            testID="detail-status"
            accessibilityLiveRegion="polite"
            style={{ fontFamily: fonts.monoBold }}
          >
            {taskStatusLine(task, now).toUpperCase()}
          </Text>
        )}

        <CallStats stats={task.stats} />
      </Plate>

      <Plate>
        <Text variant="eyebrow" tone="textMuted" accessibilityRole="header">
          {t('agent.detail.conversation')}
        </Text>
        {task.transcript.length > 0 ? (
          <Transcript lines={task.transcript} />
        ) : (
          <Text tone="textMuted" testID="detail-no-transcript">
            {active ? t('callAssist.waitingForWords') : t('agent.detail.noTranscript')}
          </Text>
        )}
      </Plate>
    </Screen>
  );
}
