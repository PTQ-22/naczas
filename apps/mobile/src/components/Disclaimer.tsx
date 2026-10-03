import { View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

interface DisclaimerProps {
  /** Copy comes from the feature's i18n file (e.g. `exam.disclaimer`) — never inline. */
  text: string;
  onMore?: () => void;
}

/** Always visible, never inside an accordion (AGENTS.md §7). */
export function Disclaimer({ text, onMore }: DisclaimerProps) {
  const { colors, space, borderWidth } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: space.sm,
        paddingTop: space.md,
        // Flat footnote under a hairline — never a box competing with the plate (redesign §7).
        borderTopWidth: borderWidth.hairline,
        borderTopColor: colors.border,
      }}
    >
      <Icon name="info" size="sm" color={colors.textMuted} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="caption" tone="textMuted">
          {text}
        </Text>
        {onMore && (
          <Button
            variant="ghost"
            label={t('common.components.disclaimerMore')}
            accessibilityHint={t('common.components.disclaimerMoreHint')}
            onPress={onMore}
          />
        )}
      </View>
    </View>
  );
}
