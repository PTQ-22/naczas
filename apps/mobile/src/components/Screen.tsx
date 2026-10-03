import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  /** Sticky bottom area for the screen's main CTA (screens.md: reachable with font scaling). */
  footer?: ReactNode;
  scroll?: boolean;
  /** Screens under a native header / tab bar don't need the top / bottom inset. */
  edges?: Edge[];
  testID?: string;
}

/** Safe area + themed background + centred content column (max 640 on web). */
export function Screen({
  children,
  footer,
  scroll = true,
  edges = ['top', 'left', 'right'],
  testID,
}: ScreenProps) {
  const { colors, layout, space, borderWidth } = useTheme();
  const column = {
    width: '100%' as const,
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center' as const,
    paddingHorizontal: layout.screenPaddingX,
  };

  return (
    <SafeAreaView testID={testID} edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[column, { paddingVertical: space.lg, gap: layout.cardGap }]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[column, { flex: 1, paddingVertical: space.lg, gap: layout.cardGap }]}>
          {children}
        </View>
      )}
      {footer && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopWidth: borderWidth.hairline,
            borderTopColor: colors.border,
          }}
        >
          <View style={[column, { paddingVertical: space.md, gap: space.sm }]}>{footer}</View>
        </View>
      )}
    </SafeAreaView>
  );
}
