import { View } from 'react-native';

import { useTheme } from '@/theme';

import type { ReactNode } from 'react';

/** Rows on the plate, separated by hairlines (no cards — redesign §4). */
export function FacilityRows({ children }: { children: ReactNode[] }) {
  const { colors, borderWidth } = useTheme();
  return (
    <View>
      {children.map((child, i) => (
        <View
          key={i}
          style={
            i > 0
              ? { borderTopWidth: borderWidth.hairline, borderTopColor: colors.border }
              : undefined
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
}
