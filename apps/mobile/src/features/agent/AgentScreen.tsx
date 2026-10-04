import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { duration } from '@/features/call-assist/task-status';
import { FacilityRows } from '@/features/facilities/FacilityRows';
import { t } from '@/i18n';
import {
  isTaskActive,
  savedTime,
  selectActiveProfile,
  useCallTasksStore,
  useProfilesStore,
} from '@/store';
import { fonts, useTheme } from '@/theme';

import { TaskRow } from './TaskRow';

/** Ticks once a second while something is counting down / on the line. */
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
 * Home tab: the agent is the product. What it saved you, the button to hand it a call, and its
 * tasks ("Moje zlecenia") — live while it dials, waits on hold or re-dials.
 */
export default function AgentScreen() {
  const { space, colors } = useTheme();
  const tasks = useCallTasksStore((s) => s.tasks);
  const profiles = useProfilesStore((s) => s.profiles);
  const patient = useProfilesStore(selectActiveProfile);
  const active = tasks.filter(isTaskActive);
  const done = tasks.filter((x) => !isTaskActive(x));
  const now = useNow(active.length > 0);
  const saved = savedTime(tasks);
  const nameOf = (id: string) =>
    profiles.length > 1 ? profiles.find((p) => p.id === id)?.name : undefined;

  return (
    <Screen wall edges={['top', 'left', 'right']}>
      <Plate>
        <View style={{ gap: space.xs }}>
          <Text variant="eyebrow" tone="textMuted">
            {t('agent.eyebrow')}
          </Text>
          <Text variant="title" accessibilityRole="header">
            {t('agent.title')}
          </Text>
          <Text tone="textMuted">{t('agent.body')}</Text>
        </View>
        {patient ? (
          <Button
            testID="agent-cta"
            icon="agent"
            label={t('agent.cta')}
            accessibilityLabel={t('agent.ctaA11y')}
            fullWidth
            onPress={() => router.push('/(tabs)/doctors')}
          />
        ) : (
          <View style={{ gap: space.sm }}>
            <Text>{t('agent.noProfile')}</Text>
            <Button
              label={t('agent.noProfileCta')}
              fullWidth
              onPress={() => router.push('/onboarding/welcome')}
            />
          </View>
        )}
        <Button
          variant="ghost"
          icon="plan"
          label={t('agent.planLink')}
          onPress={() => router.push('/(tabs)/plan')}
        />
      </Plate>

      <Plate testID="agent-saved">
        <Text variant="eyebrow" tone="textMuted">
          {t('agent.saved.title')}
        </Text>
        {saved.attempts > 0 ? (
          <View accessible style={{ gap: space.xs }}>
            <Text
              variant="display"
              color={colors.urgency.done.fg}
              style={{ fontFamily: fonts.monoBold }}
              testID="agent-saved-total"
            >
              {duration(saved.totalSec)}
            </Text>
            <Text tone="textMuted">
              {t('agent.saved.detail', {
                waited: duration(saved.waitedSec),
                calls: saved.attempts,
                booked: saved.booked,
              })}
            </Text>
          </View>
        ) : (
          <Text tone="textMuted">{t('agent.saved.none')}</Text>
        )}
      </Plate>

      <Plate>
        <Text variant="eyebrow" tone="textMuted" accessibilityRole="header">
          {t('agent.active')}
        </Text>
        {active.length === 0 ? (
          <Text tone="textMuted">{t('agent.empty')}</Text>
        ) : (
          <FacilityRows>
            {active.map((task) => (
              <TaskRow key={task.id} task={task} now={now} profileName={nameOf(task.profileId)} />
            ))}
          </FacilityRows>
        )}
      </Plate>

      {done.length > 0 && (
        <Plate>
          <Text variant="eyebrow" tone="textMuted" accessibilityRole="header">
            {t('agent.history')}
          </Text>
          <FacilityRows>
            {done.map((task) => (
              <TaskRow key={task.id} task={task} now={now} profileName={nameOf(task.profileId)} />
            ))}
          </FacilityRows>
        </Plate>
      )}
    </Screen>
  );
}
