import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

/** Temporary body for scaffolded screens — replaced as features are implemented. */
export function ScreenPlaceholder({ title }: { title: string }) {
  const { colors, layout } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: layout.screenPaddingX,
        backgroundColor: colors.bg,
      }}
    >
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}
