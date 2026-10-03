import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RestoreErrorBanner } from '@/features/settings/RestoreErrorBanner';
import { SettingsThemeProvider } from '@/features/settings/SettingsThemeProvider';
import { t } from '@/i18n';
import { NotificationSync } from '@/notifications';
import { useTheme } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Store-backed theme preferences (WS3) + themed navigator (WS4). */}
        <SettingsThemeProvider>
          <ThemedStack />
          <RestoreErrorBanner />
          <NotificationSync />
        </SettingsThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Separate component so useTheme() runs inside SettingsThemeProvider.
function ThemedStack() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/welcome" />
        <Stack.Screen name="onboarding/[step]" />
        {/* No swipe back from "done" — the survey is already saved. */}
        <Stack.Screen name="onboarding/done" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="exam/[examId]/index"
          options={{ headerShown: true, title: t('exam.title') }}
        />
        <Stack.Screen
          name="exam/[examId]/facilities"
          options={{ headerShown: true, title: t('facilities.title') }}
        />
        <Stack.Screen
          name="exam/[examId]/book"
          options={{ headerShown: true, title: t('exam.bookTitle'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="visit-prep"
          options={{ headerShown: true, title: t('visitPrep.title') }}
        />
        <Stack.Screen name="dev/components" />
      </Stack>
    </>
  );
}
