import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { tile, useTheme } from '@/theme';

interface TileWallProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cobalt hospital-tile wall behind the enamel plates. Grout is drawn as hairline Views sized from
 * onLayout — CSS gradients are New-Architecture-only on native, Views render the same everywhere.
 */
export function TileWall({ children, style }: TileWallProps) {
  const { colors, borderWidth } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // Only re-render on a real size change (rotation, web resize), not on every layout pass.
    setSize((cur) => (cur.width === width && cur.height === height ? cur : { width, height }));
  };
  const cols = Math.ceil(size.width / tile.size);
  const rows = Math.ceil(size.height / tile.size);
  const line = { position: 'absolute' as const, backgroundColor: colors.wallGrout };

  return (
    <View onLayout={onLayout} style={[{ flex: 1, backgroundColor: colors.wall }, style]}>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: cols }, (_, i) => (
          <View
            key={`c${i}`}
            style={[
              line,
              { left: (i + 1) * tile.size, top: 0, bottom: 0, width: borderWidth.hairline },
            ]}
          />
        ))}
        {Array.from({ length: rows }, (_, i) => (
          <View
            key={`r${i}`}
            style={[
              line,
              { top: (i + 1) * tile.size, left: 0, right: 0, height: borderWidth.hairline },
            ]}
          />
        ))}
      </View>
      {children}
    </View>
  );
}
