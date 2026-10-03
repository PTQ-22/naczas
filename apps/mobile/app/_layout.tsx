import { Stack } from 'expo-router';

// Root providers (theme, fonts, stores) are added here by WS3/WS4.
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
