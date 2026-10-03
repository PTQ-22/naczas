import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import type { Urgency } from '@naczas/shared';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

interface PlanTimelineSectionProps {
  urgency: Urgency;
  count: number;
  collapsible: boolean;
  initiallyCollapsed: boolean;
  isLast: boolean;
  children: ReactNode;
}

/** One urgency section on the timeline: accent dot + rail on the left, header + cards on the right. */
export function PlanTimelineSection({
  urgency,
  count,
  collapsible,
  initiallyCollapsed,
  isLast,
  children,
}: PlanTimelineSectionProps) {
  const { colors, layout, radius, space, borderWidth } = useTheme();
  const [collapsed, setCollapsed] = useState(collapsible && initiallyCollapsed);
  const palette = colors.urgency[urgency];
  const label = t(`plan.urgency.${urgency}`);
  const title = collapsible ? t('plan.section.withCount', { label, count }) : label;
  const dot = layout.icon.sm;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
      <Text variant="heading" color={palette.fg} style={{ flexShrink: 1 }}>
        {title}
      </Text>
      {collapsible && (
        <Icon name={collapsed ? 'chevronDown' : 'chevronUp'} color={colors.textMuted} />
      )}
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      {/* Rail: decorative, hidden from screen readers — the header text carries the meaning. */}
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ width: dot, alignItems: 'center' }}
      >
        <View
          style={{
            // Centre the dot on the header's first line.
            marginTop: (layout.minTouch - dot) / 2,
            width: dot,
            height: dot,
            borderRadius: radius.full,
            backgroundColor: palette.accent,
          }}
        />
        {!isLast && (
          <View
            style={{
              flex: 1,
              width: borderWidth.strong,
              backgroundColor: colors.border,
              marginTop: space.xs,
            }}
          />
        )}
      </View>

      <View style={{ flex: 1, gap: layout.cardGap, paddingBottom: isLast ? 0 : layout.sectionGap }}>
        {collapsible ? (
          <Pressable
            onPress={() => setCollapsed((c) => !c)}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={t(
              collapsed ? 'common.components.expand' : 'common.components.collapse',
            )}
            accessibilityState={{ expanded: !collapsed }}
            style={{ minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center' }}
          >
            {header}
          </Pressable>
        ) : (
          <View
            accessibilityRole="header"
            style={{ minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center' }}
          >
            {header}
          </View>
        )}
        {!collapsed && children}
      </View>
    </View>
  );
}
