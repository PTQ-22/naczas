import { use } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { TileWall } from './TileWall';

import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  /** Sticky bottom area for the screen's main CTA (screens.md: reachable with font scaling). */
  footer?: ReactNode;
  scroll?: boolean;
  /** Screens under a native header / tab bar don't need the top / bottom inset. */
  edges?: Edge[];
  /** Cobalt tile wall behind the content instead of the plain background (plan, onboarding). */
  wall?: boolean;
  testID?: string;
}

/** Safe area + themed background + centred content column (max 640 on web). */
export function Screen({
  children,
  footer,
  scroll = true,
  edges = ['top', 'left', 'right'],
  wall = false,
  testID,
}: ScreenProps) {
  const { colors, layout, space, borderWidth } = useTheme();
  // Context (not the hook) so tests without a SafeAreaProvider get 0 instead of throwing.
  const bottomInset = use(SafeAreaInsetsContext)?.bottom ?? 0;
  // A scrolling screen without a footer should run under the home indicator (as native iOS lists
  // do) instead of being sliced by a flat safe-area edge; the inset becomes trailing padding so
  // the last plate still ends with its rounded corners above the indicator.
  const scrollUnderBottom = scroll && !footer && edges.includes('bottom');
  const safeEdges = scrollUnderBottom ? edges.filter((e) => e !== 'bottom') : edges;
  const column = {
    width: '100%' as const,
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center' as const,
    paddingHorizontal: layout.screenPaddingX,
  };

  const screen = (
    <SafeAreaView
      testID={testID}
      edges={safeEdges}
      style={{ flex: 1, backgroundColor: wall ? 'transparent' : colors.bg }}
    >
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            column,
            {
              paddingTop: space.lg,
              paddingBottom: space.lg + (scrollUnderBottom ? bottomInset : 0),
              gap: layout.cardGap,
            },
          ]}
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
  return wall ? <TileWall>{screen}</TileWall> : screen;
}
