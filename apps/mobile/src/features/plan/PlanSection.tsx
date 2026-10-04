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
  /** Rows shown before a "Pokaż jeszcze N" row; all when omitted. */
  limit?: number;
  children: ReactNode;
}

/** One urgency group on the plate: mono eyebrow + rows separated by hairlines. */
export function PlanSection({
  urgency,
  count,
  collapsible,
  initiallyCollapsed,
  limit,
  children,
}: PlanSectionProps) {
  const { colors, layout, space, borderWidth } = useTheme();
  const [collapsed, setCollapsed] = useState(collapsible && initiallyCollapsed);
  const [showAll, setShowAll] = useState(false);
  const rows = Children.toArray(children);
  const hidden = limit !== undefined && !showAll ? Math.max(0, rows.length - limit) : 0;
  const hairline = (
    <View style={{ height: borderWidth.hairline, backgroundColor: colors.border }} />
  );
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
        rows.slice(0, rows.length - hidden).map((child, i) => (
          <Fragment key={i}>
            {i > 0 && hairline}
            {child}
          </Fragment>
        ))}
      {!collapsed && hidden > 0 && (
        <>
          {hairline}
          <Pressable
            onPress={() => setShowAll(true)}
            accessibilityRole="button"
            accessibilityLabel={t('plan.section.more', { count: hidden })}
            style={[rowStyle, { gap: space.xs }]}
          >
            <Text variant="label" tone="primary">
              {t('plan.section.more', { count: hidden })}
            </Text>
            <Icon name="chevronDown" size="sm" color={colors.primary} />
          </Pressable>
        </>
      )}
    </View>
  );
}
