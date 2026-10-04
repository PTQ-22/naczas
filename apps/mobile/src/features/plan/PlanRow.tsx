import { Pressable, View } from 'react-native';

import type { ExamRule, PlanItem, WaitTimeSummary } from '@naczas/shared';

import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { dateMessage, queueRange, rowDate, whyNowMessage, type Message } from './plan-view-model';

const msg = (m: Message) => t(m.key, m.params);

export interface PlanRowMarkDone {
  accessibilityLabel: string;
  onPress: () => void;
}

interface PlanRowProps {
  item: PlanItem;
  rule: ExamRule;
  today: string;
  waitTime?: WaitTimeSummary;
  onOpen: (examId: string) => void;
  /** Booked rows: a round check at the row start marks the exam done (undo via toast). */
  onMarkDone?: PlanRowMarkDone;
}

/**
 * One exam as a list row on the plate: name left, date (or queue weeks) right in mono. No card,
 * no chip — the section eyebrow already says the status (redesign §4).
 */
export function PlanRow({ item, rule, today, waitTime, onOpen, onMarkDone }: PlanRowProps) {
  const { colors, layout, space, seniorMode } = useTheme();
  const date = msg(dateMessage(item));
  const whyNow = whyNowMessage(item, rule.booking, waitTime);
  const range = item.urgency === 'act_now' ? queueRange(waitTime) : null;
  const right = range !== null ? t('plan.row.weeks', { weeks: range.text }) : rowDate(item, today);
  const rightColor =
    item.urgency === 'act_now'
      ? colors.urgency.act_now.fg
      : item.urgency === 'booked'
        ? colors.urgency.booked.fg
        : item.urgency === 'later' || item.urgency === 'done'
          ? colors.textMuted
          : colors.text;
  const muted = item.urgency === 'later' || item.urgency === 'done';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.sm,
      }}
    >
      {/* A check in the row instead of a full button under it, so the list keeps its rhythm. */}
      {onMarkDone && (
        <IconButton
          icon="check"
          accessibilityLabel={onMarkDone.accessibilityLabel}
          onPress={onMarkDone.onPress}
        />
      )}
      <Pressable
        onPress={() => onOpen(item.examId)}
        accessibilityRole="button"
        accessibilityLabel={[rule.name, date, whyNow && msg(whyNow)].filter(Boolean).join(', ')}
        accessibilityHint={t('plan.card.a11yHint')}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: layout.minTouch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View style={{ flex: 1, gap: space.xs / 2 }}>
          <Text variant={muted ? 'body' : 'label'} tone={muted ? 'textMuted' : 'text'}>
            {rule.name}
          </Text>
          {/* Senior mode: one fact per line; the "start from" hint lives on the exam screen. */}
          {whyNow && !seniorMode && item.urgency === 'this_year' && (
            <Text variant="caption" tone="textMuted">
              {msg(whyNow)}
            </Text>
          )}
        </View>
        <Text variant="data" tabular color={rightColor}>
          {right}
        </Text>
      </Pressable>
    </View>
  );
}
