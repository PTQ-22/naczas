import { Pressable, View } from 'react-native';

import { ageAt } from '@naczas/rules';
import type { ISODate, Profile } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
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

/** One person: tap the body to make them active; "Usuń" is a separate, sibling button. */
export function FamilyMemberRow({
  profile,
  active,
  today,
  onSelect,
  onRemove,
}: FamilyMemberRowProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  // One usePlan per row: hooks can't run in a loop, and the badge needs each person's plan.
  const { plan } = usePlan(profile.id);
  const urgent = countActNow(plan.items);
  const relation = t(`profiles.relation.${profile.relation}`);
  const age = t('profiles.age', { age: ageAt(profile.birthYear, today) });
  const avatar = layout.minTouch;

  const a11yLabel = [
    profile.name,
    relation,
    age,
    urgent > 0 && t('profiles.urgentA11y', { count: urgent }),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      style={active ? { borderColor: colors.primary, borderWidth: borderWidth.strong } : undefined}
    >
      <Pressable
        onPress={() => onSelect(profile.id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        accessibilityLabel={a11yLabel}
        accessibilityHint={
          active ? t('profiles.active') : t('profiles.switchTo', { name: profile.name })
        }
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          minHeight: layout.minTouch,
        }}
      >
        <View
          style={{
            width: avatar,
            height: avatar,
            borderRadius: radius.full,
            backgroundColor: active ? colors.primary : colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="heading" tone={active ? 'onPrimary' : 'text'}>
            {profile.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="heading">{profile.name}</Text>
          <Text tone="textMuted">{`${relation} · ${age}`}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {urgent > 0 && (
              <Chip
                tone="act_now"
                icon="alert"
                label={t('profiles.urgentBadge', { count: urgent })}
              />
            )}
            {active && <Chip tone="primary" icon="check" label={t('profiles.active')} />}
          </View>
        </View>
        {!active && <Icon name="chevronRight" color={colors.textMuted} />}
      </Pressable>
      <Button
        variant="ghost"
        label={t('profiles.remove')}
        accessibilityLabel={t('profiles.removeA11y', { name: profile.name })}
        onPress={() => onRemove(profile)}
      />
    </Card>
  );
}
