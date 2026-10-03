import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

interface AccordionProps {
  title: string;
  children: ReactNode;
  initiallyExpanded?: boolean;
}

/** Collapsible section. Never use it for the medical disclaimer (AGENTS.md §7). */
export function Accordion({ title, children, initiallyExpanded = false }: AccordionProps) {
  const { colors, layout, space } = useTheme();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  return (
    <View style={{ gap: space.sm }}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={t(expanded ? 'common.components.collapse' : 'common.components.expand')}
        accessibilityState={{ expanded }}
        style={{
          minHeight: layout.minTouch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
        }}
      >
        <Text variant="heading" style={{ flex: 1 }}>
          {title}
        </Text>
        <Icon name={expanded ? 'chevronUp' : 'chevronDown'} color={colors.textMuted} />
      </Pressable>
      {expanded && children}
    </View>
  );
}
