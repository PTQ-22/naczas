import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  /** Shown under the field in `danger`, announced politely. */
  error?: string | null;
  testID?: string;
}

// TODO(WS4): replace with a shared TextField from src/components when the UI kit has one.
/** Minimal labelled input on theme tokens — placeholder until WS4's form field lands. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  error,
  testID,
}: TextFieldProps) {
  const theme = useTheme();
  const { colors, space, radius, borderWidth, layout, type } = theme;
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
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
        style={[
          type.bodyLarge,
          {
            minHeight: layout.minTouch,
            paddingHorizontal: space.md,
            borderWidth: error ? borderWidth.strong : borderWidth.hairline,
            borderColor: error ? colors.danger : colors.borderStrong,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            color: colors.text,
          },
        ]}
      />
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
