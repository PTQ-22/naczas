import { Text, View } from 'react-native';

/** Temporary body for scaffolded screens — replaced as features are implemented. */
export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text accessibilityRole="header">{title}</Text>
    </View>
  );
}
