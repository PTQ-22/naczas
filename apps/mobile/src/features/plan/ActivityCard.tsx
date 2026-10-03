import { Linking, View } from 'react-native';

import type { ActivityTip } from '@naczas/rules';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

interface ActivityCardProps {
  tip: ActivityTip;
}

/** One quiet "small step" line under the plan (deck slide 6). Content + source from @naczas/rules. */
export function ActivityCard({ tip }: ActivityCardProps) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <Text variant="eyebrow" tone="textMuted">
        {t('plan.activity.heading')}
      </Text>
      <Text variant="label" accessibilityRole="header">
        {tip.title}
      </Text>
      <Text variant="caption" tone="textMuted">
        {tip.body}
      </Text>
      <Button
        variant="ghost"
        icon="external"
        accessibilityRole="link"
        label={t('plan.activity.source', { name: tip.source.name })}
        accessibilityLabel={t('plan.activity.sourceA11y', { name: tip.source.name })}
        onPress={() => void Linking.openURL(tip.source.url)}
      />
    </View>
  );
}
