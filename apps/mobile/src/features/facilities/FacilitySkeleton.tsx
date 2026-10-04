import { View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** Three grey placeholder rows while facilities load. */
export function FacilitySkeleton() {
  const { colors, radius, space } = useTheme();
  return (
    <View accessibilityLabel={t('facilities.states.loading')} style={{ gap: space.md }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          testID="facility-skeleton"
          style={{ height: 112, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt }}
        />
      ))}
    </View>
  );
}
