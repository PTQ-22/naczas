import { useEffect } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

// Long enough to read and reach "Cofnij" with large text / a screen reader (WCAG 2.2.1).
export const TOAST_DURATION_MS = 8000;

interface ToastProps {
  message: string;
  action?: { label: string; accessibilityLabel?: string; onPress: () => void };
  onHide: () => void;
  durationMs?: number;
}

/** Snackbar pinned above the screen's footer; announced politely, hides itself. */
export function Toast({ message, action, onHide, durationMs = TOAST_DURATION_MS }: ToastProps) {
  const { colors, layout, radius, space } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onHide, durationMs);
    return () => clearTimeout(timer);
  }, [onHide, durationMs]);

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: space.sm,
        paddingVertical: space.sm,
        paddingHorizontal: layout.cardPadding,
        borderRadius: radius.md,
        // Inverted surface so it stands out from cards in both schemes (text on text = AA pair).
        backgroundColor: colors.text,
      }}
    >
      <Text color={colors.bg} style={{ flex: 1, minWidth: '50%' }}>
        {message}
      </Text>
      {action && (
        <View style={{ borderRadius: radius.md, backgroundColor: colors.bg }}>
          <Button
            variant="ghost"
            label={action.label}
            accessibilityLabel={action.accessibilityLabel}
            onPress={action.onPress}
          />
        </View>
      )}
    </View>
  );
}
