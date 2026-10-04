import { View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import type { CallAssistStatus } from '@naczas/shared';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** The conversation as chat bubbles: the agent on the left, the clinic on the right. */
export function Transcript({ lines }: { lines: CallAssistStatus['transcript'] }) {
  const { space, colors, radius, motion } = useTheme();
  if (lines.length === 0) return null;
  return (
    <View style={{ gap: space.sm }} accessibilityLiveRegion="polite">
      {lines.map((line, i) => {
        const agent = line.role === 'agent';
        return (
          <Animated.View
            // Lines only ever get appended, so the index is a stable key.
            key={i}
            entering={FadeInDown.duration(motion.base).reduceMotion(ReduceMotion.System)}
            style={{
              alignSelf: agent ? 'flex-start' : 'flex-end',
              maxWidth: '88%',
              backgroundColor: agent ? colors.surfaceAlt : colors.primarySoft,
              borderRadius: radius.md,
              borderCurve: 'continuous',
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              gap: space.xs / 2,
            }}
          >
            <Text variant="eyebrow" tone="textMuted">
              {t(`callAssist.speaker.${line.role}`)}
            </Text>
            <Text selectable>{line.text}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
