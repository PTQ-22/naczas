import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (Platform.OS === 'web') return 'unsupported';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * Asks the OS for permission. Call it in context — after the user has seen their plan and an
 * explanation of what we will remind them about (WS3-7), never on app start. Does not re-prompt
 * when the OS would ignore the request anyway.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const current = await getNotificationPermission();
  if (current !== 'undetermined') return current;
  const result = await Notifications.requestPermissionsAsync();
  if (result.granted) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}
