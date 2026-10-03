import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { useRestoreStatus } from '@/store';
import { useTheme } from '@/theme';

// TODO(WS4): swap for a shared Banner/Toast component once src/components has one.
/** Shown after unreadable saved data was reset, so the user knows why things are empty. */
export function RestoreErrorBanner() {
  const failed = useRestoreStatus((s) => s.failedStores.length > 0);
  const dismiss = useRestoreStatus((s) => s.dismiss);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!failed) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        top: insets.top + theme.space.sm,
        left: theme.layout.screenPaddingX,
        right: theme.layout.screenPaddingX,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: theme.borderWidth.strong,
        borderColor: theme.colors.danger,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Text style={[theme.type.body, { flex: 1, color: theme.colors.text }]}>
        {t('settings.restoreFailed')}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.dismiss')}
        onPress={dismiss}
        style={{
          minWidth: theme.layout.minTouch,
          minHeight: theme.layout.minTouch,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={[theme.type.label, { color: theme.colors.primary }]}>
          {t('settings.dismiss')}
        </Text>
      </Pressable>
    </View>
  );
}
