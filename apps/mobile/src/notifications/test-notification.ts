import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n';

import { useInAppBannerStore } from './in-app';
import { requestNotificationPermission, type NotificationPermission } from './permissions';
import { CHANNEL_ID, ensureAndroidChannel, ensureForegroundHandler } from './sync';

export type TestNotificationResult = 'sent' | 'in-app' | Exclude<NotificationPermission, 'granted'>;

const DELAY_SECONDS = 2; // lets the presenter leave the app on stage to show a real banner

/**
 * Demo: "Send a test notification now". Native → a real local notification in a few seconds
 * (asks for permission if not decided yet, since the user explicitly pressed the button).
 * Web → no native notifications, shown as an in-app banner instead.
 */
export async function sendTestNotification(
  content: { title: string; body: string } = {
    title: t('settings.notifications.testTitle'),
    body: t('settings.notifications.testBody'),
  },
): Promise<TestNotificationResult> {
  if (Platform.OS === 'web') {
    useInAppBannerStore.getState().show({ id: 'test', ...content });
    return 'in-app';
  }
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return permission;
  ensureForegroundHandler();
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: DELAY_SECONDS,
      channelId: CHANNEL_ID,
    },
  });
  return 'sent';
}
