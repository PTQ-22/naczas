import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { betProgress } from '@/features/bet/resolve-bets';
import { t } from '@/i18n';
import { activeBetForProfile, useBetStore, useRecordsStore } from '@/store';
import { useTheme } from '@/theme';

/**
 * Entry to "Zakład o zdrowie" from the plan — it's an optional motivator, so a row next to the
 * visit summary rather than a main tab (docs/ux-review-first-run.md #8). Shows progress when a
 * bet is running.
 */
export function BetEntry({ profileId }: { profileId: string }) {
  const { colors, layout, space } = useTheme();
  const bets = useBetStore((s) => s.bets);
  const records = useRecordsStore((s) => s.records);
  const active = activeBetForProfile(bets, profileId);
  const progress = active ? betProgress(active, records) : null;
  const body =
    active && progress
      ? t('bet.entry.active', {
          amount: active.amountPln,
          completed: progress.completed,
          total: progress.total,
        })
      : t('bet.entry.body');

  return (
    <Pressable
      onPress={() => router.push('/bet')}
      accessibilityRole="button"
      accessibilityLabel={t('bet.entry.title')}
      accessibilityHint={body}
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
          {t('bet.entry.title')}
        </Text>
        <Text variant="caption" tone="textMuted">
          {body}
        </Text>
      </View>
      <Icon name="chevronRight" color={colors.primary} />
    </Pressable>
  );
}
