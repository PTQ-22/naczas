import { View } from 'react-native';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { EXAM_STEPS, type ExamStep } from './exam-view-model';

interface ExamProgressProps {
  step: ExamStep;
}

const URGENCY_FOR_STEP = { toBook: 'act_now', booked: 'booked', done: 'done' } as const;

/**
 * "Do umówienia · Umówione · Zrobione" — shows which button moves the exam forward without a
 * sentence explaining it (docs/ux-review-first-run.md #2, #6). Replaces the status eyebrow.
 */
export function ExamProgress({ step }: ExamProgressProps) {
  const { colors, space, borderWidth } = useTheme();
  const palette = colors.urgency[URGENCY_FOR_STEP[step]];
  const current = EXAM_STEPS.indexOf(step);

  return (
    <View
      accessible
      accessibilityLabel={t('exam.progress.a11y', {
        current: current + 1,
        label: t(`exam.progress.${step}`),
      })}
      style={{ flexDirection: 'row', gap: space.xs }}
    >
      {EXAM_STEPS.map((s, i) => {
        const reached = i <= current;
        return (
          // Width follows the label (+ an equal share of the rest), so "Do umówienia" doesn't wrap
          // while the short ones stay on one line; large fonts still wrap per column.
          <View key={s} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 'auto', gap: space.xs }}>
            <View
              style={{
                height: borderWidth.strong,
                backgroundColor: reached ? palette.accent : colors.border,
              }}
            />
            <Text
              variant="eyebrow"
              color={i === current ? palette.fg : undefined}
              tone={i === current ? undefined : 'textMuted'}
            >
              {t(`exam.progress.${s}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
