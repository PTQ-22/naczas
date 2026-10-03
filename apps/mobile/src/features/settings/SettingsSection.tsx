import { View } from 'react-native';

import { Card, Text } from '@/components';
import { useTheme } from '@/theme';

import type { ReactNode } from 'react';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      <Card>
        <View style={{ gap: space.md }}>{children}</View>
      </Card>
    </View>
  );
}
