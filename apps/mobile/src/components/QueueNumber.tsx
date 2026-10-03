import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import type { Urgency } from '@naczas/shared';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface QueueNumberProps {
  /** Exam name — the eyebrow above the number. */
  title: string;
  /** Status word on the right of the eyebrow ("Pilne"); coloured by `tone`. */
  status?: string;
  tone?: Urgency;
  /** The big number: weeks in the NFZ queue, or a due month when there is no queue data. */
  value: string;
  /** Uppercase line under the number ("tygodni w kolejce · 25 km"). */
  unit: string;
  /** Screen-reader reading of value + unit. */
  valueA11y: string;
  /** `compact`: half-size number (exam screen header). */
  size?: 'full' | 'compact';
  /** Slide down once on mount (respects reduce motion) — the plan's only animation. */
  animateIn?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Signature of redesign v2: the queue length printed big on the enamel plate, like a number
 * painted on a clinic door. Our differentiator ("how long is the queue → when to start") gets
 * the most visual weight on the screen; everything around it stays a quiet list.
 */
export function QueueNumber({
  title,
  status,
  tone = 'act_now',
  value,
  unit,
  valueA11y,
  size = 'full',
  animateIn = false,
  onPress,
  accessibilityHint,
  testID,
}: QueueNumberProps) {
  const { colors, type, space, motion } = useTheme();
  const compact = size === 'compact';
  // 1–3 characters print at full size; longer fallbacks ("XII.26") shrink to fit the plate.
  const scale = (compact ? 0.5 : 1) * Math.min(1, 3.2 / Math.max(value.length, 1));
  const label = [title, status, valueA11y].filter(Boolean).join(', ');

  const content = (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
        <Text variant="eyebrow" style={{ flexShrink: 1 }}>
          {title}
        </Text>
        {status && (
          <Text variant="eyebrow" color={colors.urgency[tone].fg}>
            {status}
          </Text>
        )}
      </View>
      <Text
        variant="ticket"
        tabular
        selectable
        style={{
          fontSize: Math.round(type.ticket.fontSize * scale),
          lineHeight: Math.round(type.ticket.lineHeight * scale),
          letterSpacing: (type.ticket.letterSpacing ?? 0) * scale,
        }}
      >
        {value}
      </Text>
      <Text variant="eyebrow">{unit}</Text>
    </View>
  );

  const body = onPress ? (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  ) : (
    <View testID={testID} accessible accessibilityLabel={label}>
      {content}
    </View>
  );

  if (!animateIn) return body;
  return (
    <Animated.View entering={FadeInDown.duration(motion.plate).reduceMotion(ReduceMotion.System)}>
      {body}
    </Animated.View>
  );
}
