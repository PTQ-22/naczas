import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { t } from '@/i18n';

/** Permanent entry to the GP visit summary from the plan (demo step 5). */
export function VisitPrepCard() {
  return (
    <Card>
      <Text variant="heading" accessibilityRole="header">
        {t('plan.visitPrep.title')}
      </Text>
      <Text tone="textMuted">{t('plan.visitPrep.body')}</Text>
      <Button
        variant="secondary"
        icon="chevronRight"
        label={t('plan.visitPrep.cta')}
        accessibilityLabel={t('plan.visitPrep.title')}
        onPress={() => router.push('/visit-prep')}
      />
    </Card>
  );
}
