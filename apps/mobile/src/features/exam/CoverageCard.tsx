import { View } from 'react-native';

import type { Coverage } from '@naczas/shared';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { coverageView } from './coverage-view-model';

/**
 * Quiet context on the exam plate: how many eligible people in the area NFZ counts as covered
 * by the programme. A regional statistic, not a personal one — no urgency colour, no warning.
 */
export function CoverageCard({ coverage }: { coverage: Coverage }) {
  const { colors, space, borderWidth, type } = useTheme();
  const view = coverageView(coverage);
  return (
    <View
      testID="coverage-card"
      accessible
      accessibilityLabel={`${t('exam.coverage.title')}. ${view.a11y} ${view.asOf}`}
      style={{
        gap: space.xs,
        paddingTop: space.md,
        borderTopWidth: borderWidth.strong,
        borderTopColor: colors.text,
      }}
    >
      <Text variant="eyebrow" tone="textMuted">
        {t('exam.coverage.title')}
      </Text>
      <Text variant="label">{view.area}</Text>
      <Text
        variant="data"
        tabular
        // Plex Mono at display size: numbers are mono everywhere (redesign §3).
        style={{ fontSize: type.display.fontSize * 1.5, lineHeight: type.display.lineHeight * 1.5 }}
      >
        {view.percent}
      </Text>
      <Text>{view.body}</Text>
      <Text variant="caption" tone="textSubtle">
        {view.asOf}
      </Text>
    </View>
  );
}
