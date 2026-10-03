import { Linking } from 'react-native';

import type { ActivityTip } from '@naczas/rules';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { t } from '@/i18n';

interface ActivityCardProps {
  tip: ActivityTip;
}

/** Single activity tip under the plan (deck slide 6). Content + source come from @naczas/rules. */
export function ActivityCard({ tip }: ActivityCardProps) {
  return (
    <Card>
      <Chip tone="primary" icon="time" label={t('plan.activity.heading')} />
      <Text variant="heading" accessibilityRole="header">
        {tip.title}
      </Text>
      <Text>{tip.body}</Text>
      <Button
        variant="ghost"
        icon="external"
        accessibilityRole="link"
        label={t('plan.activity.source', { name: tip.source.name })}
        accessibilityLabel={t('plan.activity.sourceA11y', { name: tip.source.name })}
        onPress={() => void Linking.openURL(tip.source.url)}
      />
    </Card>
  );
}
