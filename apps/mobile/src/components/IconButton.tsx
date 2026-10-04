import { Pressable } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  icon: IconName;
  /** Required: an icon alone has no accessible name. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link';
  onPress: () => void;
  /** Filled cobalt for the screen's main action; outlined otherwise. */
  filled?: boolean;
  /** For disclosure buttons (e.g. "⋯"): announced as expanded / collapsed. */
  expanded?: boolean;
  /** No circle, larger glyph: for low-key controls like "⋯". Touch target stays the same. */
  bare?: boolean;
  /** Destructive action: red outline and icon instead of cobalt. */
  danger?: boolean;
  testID?: string;
}

/** Round icon-only button, min touch target from tokens (44 / senior 56). */
export function IconButton({
  icon,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  onPress,
  filled = false,
  expanded,
  bare = false,
  danger = false,
  testID,
}: IconButtonProps) {
  const { colors, layout, radius, borderWidth } = useTheme();
  const tint = danger ? colors.danger : colors.primary;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      style={({ pressed }) => ({
        width: layout.minTouch,
        height: layout.minTouch,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: bare ? 0 : borderWidth.strong,
        borderColor: tint,
        backgroundColor: filled
          ? pressed
            ? colors.primaryPressed
            : colors.primary
          : pressed
            ? colors.primarySoft
            : 'transparent',
      })}
    >
      <Icon name={icon} size={bare ? 'lg' : 'md'} color={filled ? colors.onPrimary : tint} />
    </Pressable>
  );
}
