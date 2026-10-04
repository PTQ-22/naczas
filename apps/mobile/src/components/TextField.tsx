import { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** Helper text under the field (hidden while an error is shown). */
  hint?: string;
  /** Shown under the field in `danger` with an icon, announced politely. */
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoComplete?: TextInputProps['autoComplete'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
  testID?: string;
}

/** Labelled input on tokens: 2 px border, 3 px focus ring, error never by colour alone. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  maxLength,
  autoComplete,
  autoCapitalize,
  secureTextEntry,
  accessibilityLabel,
  testID,
}: TextFieldProps) {
  const { colors, space, radius, borderWidth, layout, type } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.focus : colors.borderStrong;

  return (
    <View style={{ gap: space.xs }}>
      <Text variant="label">{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel ?? label}
        // Screen readers hear the error (or hint) right after the label, not only via colour.
        accessibilityHint={error ?? hint}
        style={[
          type.bodyLarge,
          {
            minHeight: layout.minTouch,
            paddingHorizontal: space.md,
            paddingVertical: space.sm,
            borderWidth: focused || error ? borderWidth.focus : borderWidth.strong,
            borderColor,
            borderRadius: radius.sm,
            backgroundColor: colors.surface,
            color: colors.text,
          },
        ]}
      />
      {error ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}
        >
          <Icon name="alert" size="sm" color={colors.danger} />
          <Text variant="caption" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" tone="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
