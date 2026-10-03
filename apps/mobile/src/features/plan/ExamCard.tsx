import { Pressable, View } from 'react-native';

import type { ExamRule, PlanItem, Urgency } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import {
  dateMessage,
  planCta,
  whyNowMessage,
  type CtaAction,
  type Message,
} from './plan-view-model';

export const urgencyIcon: Record<Urgency, IconName> = {
  act_now: 'alert',
  this_year: 'calendar',
  later: 'time',
  booked: 'booked',
  done: 'check',
};

const msg = (m: Message) => t(m.key, m.params);

interface ExamCardProps {
  item: PlanItem;
  rule: ExamRule;
  isFirstActNow: boolean;
  onOpen: (examId: string) => void;
  onCta: (action: CtaAction, examId: string) => void;
}

export function ExamCard({ item, rule, isFirstActNow, onOpen, onCta }: ExamCardProps) {
  const { colors, seniorMode, space } = useTheme();
  const palette = colors.urgency[item.urgency];
  const compact = item.urgency === 'later' || item.urgency === 'done';

  const urgencyLabel = t(`plan.urgency.${item.urgency}`);
  const date = msg(dateMessage(item));
  const whyNow = whyNowMessage(item, rule.booking);
  const cta = planCta(item, rule.booking, isFirstActNow);
  const showEstimate = whyNow !== null && item.leadTimeSource === 'default';
  const reason = item.reasons[0];

  const a11yLabel = [rule.name, urgencyLabel, date, whyNow && msg(whyNow)]
    .filter(Boolean)
    .join(', ');

  return (
    <Card accent={palette.accent}>
      {/* Body and CTA are siblings, not nested: a button inside an accessible button is
          unreachable for VoiceOver/TalkBack (screens.md: CTA focusable on its own). */}
      <Pressable
        onPress={() => onOpen(item.examId)}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={t('plan.card.a11yHint')}
        style={({ pressed }) => ({ gap: space.sm, opacity: pressed ? 0.7 : 1 })}
      >
        {!compact && (
          <Chip tone={item.urgency} icon={urgencyIcon[item.urgency]} label={urgencyLabel} />
        )}
        <Text variant="heading">{rule.name}</Text>
        <Text tone={compact ? 'textMuted' : 'text'}>{date}</Text>
        {whyNow && <Text color={palette.fg}>{msg(whyNow)}</Text>}
        {showEstimate && (
          <Text variant="caption" tone="textSubtle">
            {t('plan.card.estimatedWait')}
          </Text>
        )}
        {/* Senior mode: one fact per line, the reasoning lives on the exam screen. */}
        {!compact && !seniorMode && reason && (
          <Text variant="caption" tone="textMuted">
            {reason}
          </Text>
        )}
      </Pressable>
      {cta && (
        <View style={{ paddingTop: space.xs }}>
          <Button
            label={msg(cta.label)}
            accessibilityLabel={
              cta.action === 'facilities'
                ? t('plan.cta.findSlotA11y', {
                    name: rule.name,
                    weeks: Number(cta.label.params?.weeks ?? 0),
                  })
                : t('plan.cta.a11ySuffix', { label: msg(cta.label), name: rule.name })
            }
            variant={cta.variant}
            fullWidth={seniorMode || cta.variant === 'primary'}
            onPress={() => onCta(cta.action, item.examId)}
          />
        </View>
      )}
    </Card>
  );
}
