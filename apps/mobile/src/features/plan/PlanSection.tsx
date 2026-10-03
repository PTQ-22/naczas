import { Children, Fragment, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import type { Urgency } from '@naczas/shared';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

interface PlanSectionProps {
  urgency: Urgency;
  count: number;
  collapsible: boolean;
  initiallyCollapsed: boolean;
  children: ReactNode;
}

/** One urgency group on the plate: mono eyebrow + rows separated by hairlines. */
export function PlanSection({
  urgency,
  count,
  collapsible,
  initiallyCollapsed,
  children,
}: PlanSectionProps) {
  const { colors, layout, space, borderWidth } = useTheme();
  const [collapsed, setCollapsed] = useState(collapsible && initiallyCollapsed);
  const label = t(`plan.urgency.${urgency}`);
  const title = collapsible ? t('plan.section.withCount', { label, count }) : label;
  const color = urgency === 'act_now' ? colors.urgency.act_now.fg : colors.textMuted;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, flex: 1 }}>
      <Text variant="eyebrow" color={color} style={{ flexShrink: 1 }}>
        {title}
      </Text>
      {collapsible && (
        <Icon
          name={collapsed ? 'chevronRight' : 'chevronDown'}
          size="sm"
          color={colors.textMuted}
        />
      )}
    </View>
  );
  const rowStyle = {
    minHeight: layout.minTouch,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  };

  return (
    <View
      style={{
        borderTopWidth: borderWidth.strong,
        borderTopColor: colors.text,
        paddingTop: space.xs,
      }}
    >
      {collapsible ? (
        <Pressable
          onPress={() => setCollapsed((c) => !c)}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityHint={t(
            collapsed ? 'common.components.expand' : 'common.components.collapse',
          )}
          accessibilityState={{ expanded: !collapsed }}
          style={rowStyle}
        >
          {header}
        </Pressable>
      ) : (
        <View accessibilityRole="header" style={rowStyle}>
          {header}
        </View>
      )}
      {!collapsed &&
        Children.toArray(children).map((child, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <View style={{ height: borderWidth.hairline, backgroundColor: colors.border }} />
            )}
            {child}
          </Fragment>
        ))}
    </View>
  );
}
