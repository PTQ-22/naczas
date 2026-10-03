import { Pressable, View } from 'react-native';

import { ageAt } from '@naczas/rules';
import type { ISODate, Profile } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { countActNow } from '@/features/plan/plan-view-model';
import { t } from '@/i18n';
import { usePlan } from '@/services';
import { useTheme } from '@/theme';

interface FamilyMemberRowProps {
  profile: Profile;
  active: boolean;
  today: ISODate;
  onSelect: (id: string) => void;
  onRemove: (profile: Profile) => void;
}

/**
 * One person as a row on the plate (redesign v2): radio + name + relation/age, urgent count as a
 * mono caption. Tap the body to make them active; "Usuń" is a separate, sibling button.
 */
export function FamilyMemberRow({
  profile,
  active,
  today,
  onSelect,
  onRemove,
}: FamilyMemberRowProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  const dot = layout.icon.md;
  // One usePlan per row: hooks can't run in a loop, and the badge needs each person's plan.
  const { plan } = usePlan(profile.id);
  const urgent = countActNow(plan.items);
  const relation = t(`profiles.relation.${profile.relation}`);
  const age = t('profiles.age', { age: ageAt(profile.birthYear, today) });

  const a11yLabel = [
    profile.name,
    relation,
    age,
    urgent > 0 && t('profiles.urgentA11y', { count: urgent }),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={{ gap: space.xs, paddingVertical: space.sm }}>
      <Pressable
        onPress={() => onSelect(profile.id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        accessibilityLabel={a11yLabel}
        accessibilityHint={
          active ? t('profiles.active') : t('profiles.switchTo', { name: profile.name })
        }
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          minHeight: layout.minTouch,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        {/* Radio, not an avatar: which plan the app shows is the one choice made here. */}
        <View
          style={{
            width: dot,
            height: dot,
            borderRadius: radius.full,
            borderWidth: borderWidth.strong,
            borderColor: active ? colors.primary : colors.borderStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {active && (
            <View
              style={{
                width: dot / 2,
                height: dot / 2,
                borderRadius: radius.full,
                backgroundColor: colors.primary,
              }}
            />
          )}
        </View>
        <View style={{ flex: 1, gap: space.xs / 2 }}>
          <Text variant="title">{profile.name}</Text>
          <Text variant="caption" tone="textMuted">{`${relation} · ${age}`}</Text>
          {active && (
            <Text variant="eyebrow" color={colors.primary}>
              {t('profiles.active')}
            </Text>
          )}
        </View>
        {urgent > 0 && (
          <Text variant="eyebrow" color={colors.urgency.act_now.fg}>
            {t('profiles.urgentBadge', { count: urgent })}
          </Text>
        )}
        {!active && <Icon name="chevronRight" color={colors.textMuted} />}
      </Pressable>
      <Button
        variant="ghost"
        label={t('profiles.remove')}
        accessibilityLabel={t('profiles.removeA11y', { name: profile.name })}
        onPress={() => onRemove(profile)}
      />
    </View>
  );
}
