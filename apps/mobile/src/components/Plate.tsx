import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import type { ReactNode } from 'react';

interface PlateProps {
  children: ReactNode;
  /** Square top-left corner so folder tabs (ProfileSwitcher) attach to the plate. */
  tabbed?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Cream enamel plate with an ink frame — the one container of redesign v2. Flat (no shadow):
 * the frame and the cobalt wall do the separating. Content inside is a quiet list, not cards.
 */
export function Plate({ children, tabbed = false, style, testID }: PlateProps) {
  const { colors, radius, borderWidth, layout, space } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: borderWidth.plate,
          borderColor: colors.text,
          borderRadius: radius.plate,
          borderCurve: 'continuous',
          borderTopLeftRadius: tabbed ? 0 : radius.plate,
          padding: layout.cardPadding,
          gap: space.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
