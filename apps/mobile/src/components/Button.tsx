import { ActivityIndicator, Pressable, View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  /** One filled `primary` per screen (tokens.md §6.3); others secondary / ghost. */
  variant?: ButtonVariant;
  /** Defaults to `label`; set when the visible text needs context for screen readers. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** 'link' for buttons that leave the app (tel:, maps, source URL). */
  accessibilityRole?: 'button' | 'link';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const { colors, layout, radius, space, borderWidth } = theme;
  const inactive = disabled || loading;
  const fg = variant === 'primary' ? colors.onPrimary : colors.primary;
  // Inline ghost buttons read as links in running text: left-aligned when they wrap.
  const leftAligned = variant === 'ghost' && !fullWidth;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={
        loading
          ? `${accessibilityLabel ?? label}, ${t('common.components.loading')}`
          : (accessibilityLabel ?? label)
      }
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: layout.minTouch,
          minWidth: layout.minTouch,
          paddingHorizontal: variant === 'ghost' ? space.sm : space.lg,
          paddingVertical: space.sm,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          alignItems: leftAligned ? 'flex-start' : 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'primary' && {
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        },
        variant === 'secondary' && {
          borderWidth: borderWidth.strong,
          borderColor: colors.primary,
          backgroundColor: pressed ? colors.primarySoft : 'transparent',
        },
        variant === 'ghost' && { backgroundColor: pressed ? colors.primarySoft : 'transparent' },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 }}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          icon && <Icon name={icon} size="sm" color={fg} />
        )}
        <Text
          variant="label"
          color={fg}
          style={{ textAlign: leftAligned ? 'left' : 'center', flexShrink: 1 }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
