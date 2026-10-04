import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { rules } from '@naczas/rules';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { cancelTask, retryTaskNow } from '@/features/call-assist/call-tasks';
import { CallStats } from '@/features/call-assist/CallStats';
import { taskStatusLine } from '@/features/call-assist/task-status';
import { t } from '@/i18n';
import type { CallTask } from '@/store';
import { useTheme } from '@/theme';

interface TaskRowProps {
  task: CallTask;
  now: number;
  /** Shown when the family has more than one person */
  profileName?: string;
}

/** One agent task: what, where, the live status — tap for the call screen. */
export function TaskRow({ task, now, profileName }: TaskRowProps) {
  const { colors, space, layout } = useTheme();
  const exam = rules.find((r) => r.id === task.examId)?.name ?? task.examId;
  const status = taskStatusLine(task, now);
  const booked = task.result?.booked && task.result.date;
  const tone = booked
    ? colors.urgency.done.fg
    : task.status === 'failed'
      ? colors.danger
      : task.closed
        ? colors.textMuted
        : colors.primary;

  return (
    <View style={{ gap: space.xs, paddingVertical: space.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('agent.taskA11y', { exam, facility: task.facilityName, status })}
        accessibilityHint={t('agent.open')}
        onPress={() => router.push({ pathname: '/call/[taskId]', params: { taskId: task.id } })}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          minHeight: layout.minTouch,
        }}
      >
        <View style={{ flex: 1, gap: space.xs / 2 }}>
          <Text variant="label">{exam}</Text>
          <Text variant="caption" tone="textMuted">
            {profileName
              ? `${task.facilityName} · ${t('agent.forProfile', { name: profileName })}`
              : task.facilityName}
          </Text>
          <Text variant="caption" color={tone} testID="task-status">
            {status}
          </Text>
          <CallStats stats={task.stats} />
        </View>
        <Icon name="chevronRight" color={colors.textMuted} />
      </Pressable>
      {task.status === 'retry_scheduled' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          <Button
            size="small"
            icon="phone"
            label={t('callAssist.retryNow')}
            onPress={() => void retryTaskNow(task.id).catch(() => undefined)}
          />
          <Button
            size="small"
            variant="ghost"
            label={t('callAssist.cancel')}
            onPress={() => void cancelTask(task.id).catch(() => undefined)}
          />
        </View>
      )}
    </View>
  );
}
