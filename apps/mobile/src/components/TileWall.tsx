import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import type { ReactNode } from 'react';

interface TileWallProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Plain tinted "wall" behind the plates (plan, onboarding). It used to draw a tile grid; the grid
 * was dropped as too busy for a medical app, the tint alone separates the white plates.
 */
export function TileWall({ children, style }: TileWallProps) {
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.wall }, style]}>{children}</View>;
}
