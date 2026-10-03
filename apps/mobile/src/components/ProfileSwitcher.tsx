import { Pressable, ScrollView, View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface ProfileSwitcherItem {
  id: string;
  name: string;
  /** Number of act_now items — shown as a badge. */
  urgentCount: number;
}

interface ProfileSwitcherProps {
  profiles: ProfileSwitcherItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
}

/** Horizontal avatar tabs. Data comes from the WS3 store; this is presentation only. */
export function ProfileSwitcher({ profiles, activeId, onSelect, onAdd }: ProfileSwitcherProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  const avatar = layout.minTouch;
  const act = colors.urgency.act_now;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={{ gap: space.sm, paddingVertical: space.xs }}
    >
      {profiles.map((p) => {
        const selected = p.id === activeId;
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              p.urgentCount > 0
                ? t('common.components.profileWithUrgent', { name: p.name, count: p.urgentCount })
                : p.name
            }
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              minHeight: layout.minTouch,
              paddingLeft: space.xs,
              paddingRight: space.md,
              borderRadius: radius.full,
              borderWidth: borderWidth.strong,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected || pressed ? colors.primarySoft : colors.surface,
            })}
          >
            <View
              style={{
                width: avatar - space.sm * 2,
                height: avatar - space.sm * 2,
                borderRadius: radius.full,
                backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="label" tone={selected ? 'onPrimary' : 'text'}>
                {p.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text variant="label">{p.name}</Text>
            {p.urgentCount > 0 && (
              <View
                style={{
                  minWidth: layout.icon.md,
                  paddingHorizontal: space.xs,
                  borderRadius: radius.full,
                  backgroundColor: act.bg,
                  alignItems: 'center',
                }}
              >
                <Text variant="caption" color={act.fg} style={{ fontWeight: '700' }}>
                  {p.urgentCount}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
      {onAdd && (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t('common.components.addProfile')}
          style={({ pressed }) => ({
            width: avatar,
            height: avatar,
            borderRadius: radius.full,
            borderWidth: borderWidth.strong,
            borderColor: colors.borderStrong,
            backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Icon name="plus" color={colors.text} />
        </Pressable>
      )}
    </ScrollView>
  );
}
