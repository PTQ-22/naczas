import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** Permanent entry to the GP visit summary from the plan (demo step 5) — a row, not a card. */
export function VisitPrepCard() {
  const { colors, layout, space } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/visit-prep')}
      accessibilityRole="button"
      accessibilityLabel={t('plan.visitPrep.title')}
      accessibilityHint={t('plan.visitPrep.body')}
      style={({ pressed }) => ({
        minHeight: layout.minTouch,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: space.xs / 2 }}>
        <Text variant="label" color={colors.primary}>
          {t('plan.visitPrep.title')}
        </Text>
        <Text variant="caption" tone="textMuted">
          {t('plan.visitPrep.body')}
        </Text>
      </View>
      <Icon name="chevronRight" color={colors.primary} />
    </Pressable>
  );
}
