import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { t } from '@/i18n';

// TODO(WS4): wrap in the theme provider from src/theme once it exists (seniorMode/darkMode from settings store).
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
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
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
