import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ title, body, icon = 'check', action }: EmptyStateProps) {
  const { colors, space } = useTheme();
  return (
    <View
      style={{ alignItems: 'center', gap: space.md, paddingVertical: space['2xl'] }}
      accessibilityLiveRegion="polite"
    >
      <Icon name={icon} size="lg" color={colors.primary} />
      <Text variant="heading" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body && (
        <Text tone="textMuted" style={{ textAlign: 'center' }}>
          {body}
        </Text>
      )}
      {action && <Button label={action.label} onPress={action.onPress} />}
    </View>
  );
}
