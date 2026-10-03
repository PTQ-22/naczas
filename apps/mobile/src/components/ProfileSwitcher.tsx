import { Pressable, ScrollView } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface ProfileSwitcherItem {
  id: string;
  name: string;
  /** Number of act_now items — shown in red next to the name. */
  urgentCount: number;
}

interface ProfileSwitcherProps {
  profiles: ProfileSwitcherItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
}

/**
 * Folder-divider tabs that sit on top of a `<Plate tabbed>` (redesign v2: tabs like a patient
 * file's dividers, not pills). The active tab takes the plate's colour and covers the plate's top
 * frame under it, so it reads as part of the plate. Presentation only — data comes from WS3.
 */
export function ProfileSwitcher({ profiles, activeId, onSelect, onAdd }: ProfileSwitcherProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  const frame = borderWidth.plate;
  const tab = (selected: boolean, pressed: boolean) => ({
    minHeight: layout.minTouch + (selected ? frame : 0),
    minWidth: layout.minTouch,
    // The plate below is pulled up by `frame`: the active tab is `frame` taller and covers the
    // plate's top border; inactive tabs stop on top of it.
    marginBottom: selected ? 0 : frame,
    paddingHorizontal: space.md,
    paddingBottom: selected ? frame : 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: space.sm,
    borderWidth: frame,
    borderBottomWidth: 0,
    borderColor: colors.text,
    borderTopLeftRadius: radius.tab,
    borderTopRightRadius: radius.tab,
    backgroundColor: selected ? colors.surface : pressed ? colors.wall : colors.wallGrout,
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      // Above the plate so the active tab can cover the plate's top frame.
      style={{ zIndex: 1, flexGrow: 0 }}
      contentContainerStyle={{ gap: space.xs, alignItems: 'flex-end' }}
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
            style={({ pressed }) => tab(selected, pressed)}
          >
            <Text
              variant={selected ? 'label' : 'body'}
              color={selected ? colors.text : colors.onWall}
            >
              {p.name}
            </Text>
            {p.urgentCount > 0 && (
              // Bare number, no pill: inactive tabs sit on the wall, where act_now.fg fails AA.
              <Text
                variant="data"
                tabular
                color={selected ? colors.urgency.act_now.fg : colors.urgentOnWall}
              >
                {p.urgentCount}
              </Text>
            )}
          </Pressable>
        );
      })}
      {onAdd && (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t('common.components.addProfile')}
          style={({ pressed }) => tab(false, pressed)}
        >
          <Icon name="plus" color={colors.onWall} />
        </Pressable>
      )}
    </ScrollView>
  );
}
