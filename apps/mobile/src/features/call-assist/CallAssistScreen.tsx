import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { rules } from '@naczas/rules';
import type { CallAssistStatus } from '@naczas/shared';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { successHaptic } from '@/components/haptics';
import { Icon, type IconName } from '@/components/Icon';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { selectActiveProfile, useProfilesStore, useRecordsStore } from '@/store';
import { fonts, useTheme } from '@/theme';

import { buildCallRequest, inSentence } from './call-request';
import { useCallAssist, type CallAssistState } from './use-call-assist';

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Seconds since the call was answered — local, only for the on-screen timer. */
function useTalkTimer(talking: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!talking) return;
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, [talking]);
  return elapsed;
}

function statusLine(state: CallAssistState, elapsedMs: number): string {
  if (state.analysing) return t('callAssist.status.analysing');
  const s = state.status?.status;
  if (!s) return t('callAssist.status.starting');
  if (s === 'in_progress') return t('callAssist.status.in_progress', { time: clock(elapsedMs) });
  if (s === 'failed') return t('callAssist.status.ended');
  return t(`callAssist.status.${s}`);
}

function Point({ icon, text }: { icon: IconName; text: string }) {
  const { space, colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
      <Icon name={icon} size="sm" color={colors.primary} />
      <Text style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}

function Transcript({ lines }: { lines: CallAssistStatus['transcript'] }) {
  const { space, colors, radius, motion } = useTheme();
  if (lines.length === 0) {
    return <Text tone="textMuted">{t('callAssist.waitingForWords')}</Text>;
  }
  return (
    <View style={{ gap: space.sm }} accessibilityLiveRegion="polite">
      {lines.map((line, i) => {
        const agent = line.role === 'agent';
        return (
          <Animated.View
            // Lines only ever get appended, so the index is a stable key.
            key={i}
            entering={FadeInDown.duration(motion.base).reduceMotion(ReduceMotion.System)}
            style={{
              alignSelf: agent ? 'flex-start' : 'flex-end',
              maxWidth: '88%',
              backgroundColor: agent ? colors.surfaceAlt : colors.primarySoft,
              borderRadius: radius.md,
              borderCurve: 'continuous',
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              gap: space.xs / 2,
            }}
          >
            <Text variant="eyebrow" tone="textMuted">
              {t(`callAssist.speaker.${line.role}`)}
            </Text>
            <Text selectable>{line.text}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function CallAssistScreen() {
  const { examId, facility } = useLocalSearchParams<{ examId: string; facility?: string }>();
  const { space, colors, type } = useTheme();
  const patient = useProfilesStore(selectActiveProfile);
  const profiles = useProfilesStore((s) => s.profiles);
  const markBooked = useRecordsStore((s) => s.markBooked);
  const rule = rules.find((r) => r.id === examId);
  const { state, start, reset } = useCallAssist();
  const elapsed = useTalkTimer(state.status?.status === 'in_progress');

  const result = state.phase === 'finished' ? state.status?.result : null;
  const bookedDate = result?.booked ? result.date : null;

  // The whole point of the demo: the phone call ends and the plan updates itself.
  const saved = useRef(false);
  useEffect(() => {
    if (!bookedDate || !patient || !rule || saved.current) return;
    saved.current = true;
    markBooked(patient.id, rule.id, bookedDate);
    successHaptic();
  }, [bookedDate, patient, rule, markBooked]);

  if (!rule || !patient) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState icon="info" title={t('exam.notFound.title')} />
      </Screen>
    );
  }

  const facilityName = facility ?? '';
  const call = () => {
    saved.current = false;
    void start(buildCallRequest({ patient, profiles, rule, facilityName }));
  };
  const toManual = () =>
    router.replace({ pathname: '/exam/[examId]/book', params: { examId, facility: facilityName } });

  const footer = (() => {
    if (state.phase === 'idle') {
      return (
        <Button
          label={t('callAssist.start')}
          accessibilityLabel={t('callAssist.startA11y')}
          icon="phone"
          fullWidth
          onPress={call}
        />
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
    if (state.phase === 'finished' || state.phase === 'error') {
      return (
        <View style={{ gap: space.xs }}>
          <Button
            label={t('callAssist.retry')}
            icon="phone"
            fullWidth
            onPress={() => {
              reset();
              call();
            }}
          />
          <Button label={t('callAssist.manual')} variant="ghost" fullWidth onPress={toManual} />
        </View>
      );
    }
    return undefined;
  })();

  return (
    <Screen edges={['left', 'right', 'bottom']} footer={footer}>
      {state.phase === 'idle' ? (
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
            <Point icon="check" text={t('callAssist.points.privacy')} />
            <Point icon="phone" text={t('callAssist.points.demo')} />
          </View>
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
                  {result?.time
                    ? t('callAssist.booked.when', {
                        weekday: format(parseISO(bookedDate), 'EEEE', { locale: pl }),
                        time: result.time,
                      })
                    : t('callAssist.booked.whenNoTime', {
                        weekday: format(parseISO(bookedDate), 'EEEE', { locale: pl }),
                      })}
                </Text>
                <Text tone="textMuted">{`${rule.name} · ${facilityName}`}</Text>
              </View>
              <Text>{t('callAssist.booked.saved')}</Text>
              {result?.note ? <Text tone="textMuted">{result.note}</Text> : null}
            </Plate>
          ) : (
            <View style={{ gap: space.xs }} accessibilityLiveRegion="polite">
              <Text
                variant="heading"
                style={{ fontFamily: fonts.monoBold, fontSize: type.heading.fontSize }}
              >
                {state.phase === 'error'
                  ? t('callAssist.failed.title')
                  : statusLine(state, elapsed).toUpperCase()}
              </Text>
              {state.mode === 'simulated' && (
                <Text variant="caption" tone="textMuted">
                  {t('callAssist.simulated')}
                </Text>
              )}
              {state.phase === 'error' && <Text>{t('callAssist.error')}</Text>}
              {state.phase === 'finished' && state.status?.status === 'failed' && (
                <Text>{t('callAssist.failed.body')}</Text>
              )}
              {state.phase === 'finished' && state.status?.status === 'ended' && (
                <>
                  <Text variant="label">{t('callAssist.notBooked.title')}</Text>
                  <Text>{t('callAssist.notBooked.body')}</Text>
                </>
              )}
            </View>
          )}
          <Transcript lines={state.status?.transcript ?? []} />
        </View>
      )}
    </Screen>
  );
}
