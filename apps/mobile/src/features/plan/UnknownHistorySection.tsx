import { Fragment, useState } from 'react';
import { Pressable, View } from 'react-native';

import { assumedLastDone, effectiveIntervalMonths, getExamRule } from '@naczas/rules';
import type { LastDoneAnswer, PlanItem, Profile } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TimelineScale } from '@/components/TimelineScale';
import { lastDoneLabel } from '@/features/onboarding/last-done-labels';
import { t } from '@/i18n';
import { useRecordsStore } from '@/store';
import { useTheme } from '@/theme';

// Same scale as onboarding step 7; "nie pamiętam" is simply not answering.
const ANSWERS = ['within_half_interval', 'within_interval', 'over_interval', 'never'] as const;

interface UnknownHistorySectionProps {
  items: readonly PlanItem[];
  profile: Profile;
  today: string;
  onOpen: (examId: string) => void;
  onAnswered: (examId: string) => void;
}

/**
 * Exams we can't date: the onboarding answer was left empty. Instead of a red "termin minął" they
 * get one quiet group; a row opens the same "kiedy ostatnio?" scale inline, and the answer moves
 * the exam to its real section (docs/ux-review-first-run.md #1).
 */
export function UnknownHistorySection({
  items,
  profile,
  today,
  onOpen,
  onAnswered,
}: UnknownHistorySectionProps) {
  const { colors, layout, space, borderWidth } = useTheme();
  const setLastDone = useRecordsStore((s) => s.setLastDone);
  const [openId, setOpenId] = useState<string | null>(null);

  const answer = (examId: string, value: LastDoneAnswer) => {
    const interval = effectiveIntervalMonths(getExamRule(examId), profile, today);
    setLastDone(profile.id, examId, assumedLastDone(value, interval, today));
    setOpenId(null);
    onAnswered(examId);
  };

  return (
    <View
      style={{
        borderTopWidth: borderWidth.strong,
        borderTopColor: colors.text,
        paddingTop: space.xs,
      }}
    >
      <View
        accessibilityRole="header"
        style={{ minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center' }}
      >
        <Text variant="eyebrow" tone="textMuted">
          {t('plan.unknown.heading')}
        </Text>
      </View>
      {items.map((item, i) => {
        const rule = getExamRule(item.examId);
        const open = openId === item.examId;
        const interval = effectiveIntervalMonths(rule, profile, today);
        return (
          <Fragment key={item.examId}>
            {i > 0 && (
              <View style={{ height: borderWidth.hairline, backgroundColor: colors.border }} />
            )}
            <View style={{ gap: space.sm, paddingVertical: space.sm }}>
              <Pressable
                onPress={() => setOpenId(open ? null : item.examId)}
                accessibilityRole="button"
                accessibilityLabel={t('plan.unknown.rowA11y', { name: rule.name })}
                accessibilityState={{ expanded: open }}
                style={({ pressed }) => ({
                  minHeight: layout.minTouch,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text variant="label" style={{ flex: 1 }}>
                  {rule.name}
                </Text>
                <Icon
                  name={open ? 'chevronDown' : 'chevronRight'}
                  size="sm"
                  color={colors.primary}
                />
              </Pressable>
              {open && (
                <>
                  <TimelineScale
                    groupLabel={rule.name}
                    options={ANSWERS.map((value) => ({
                      value,
                      label: lastDoneLabel(value, interval, 'short'),
                      accessibilityLabel: lastDoneLabel(value, interval),
                    }))}
                    selected={undefined}
                    onSelect={(value) => answer(item.examId, value)}
                    startLabel={t('onboarding.steps.lastExams.axisRecent')}
                    endLabel={t('onboarding.steps.lastExams.axisLongAgo')}
                  />
                  <Button
                    variant="ghost"
                    label={t('plan.unknown.about')}
                    accessibilityLabel={t('plan.cta.a11ySuffix', {
                      label: t('plan.unknown.about'),
                      name: rule.name,
                    })}
                    onPress={() => onOpen(item.examId)}
                  />
                </>
              )}
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}
