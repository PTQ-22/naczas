import { format, parseISO } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { rules } from '@naczas/rules';
import type { ISODate, TimeOfDay } from '@naczas/shared';

import { t } from '@/i18n';

import { useInAppBannerStore } from './in-app';
import { CHANNEL_ID, ensureAndroidChannel, ensureForegroundHandler } from './sync';

export interface AgentBookedInput {
  callId: string;
  examId: string;
  profileName: string;
  facilityName: string;
  date: ISODate;
  time?: TimeOfDay | undefined;
}

/** Title/body for "the agent booked a visit" — shared by the OS notification and the web banner. */
export function agentBookedContent({
  examId,
  profileName,
  facilityName,
  date,
  time,
}: AgentBookedInput) {
  const exam = rules.find((r) => r.id === examId)?.name ?? examId;
  const when = format(parseISO(date), 'dd.MM.yyyy') + (time ? `, ${time}` : '');
  return {
    title: t('settings.notifications.agentBookedTitle', { exam }),
    body: t('settings.notifications.agentBookedBody', {
      name: profileName,
      when,
      facility: facilityName,
    }),
  };
}

/**
 * Right after the agent's call books a visit — the moment the user handed off and probably left
 * the app. Never asks for permission (that's the plan screen's job); without it, stays silent.
 */
export async function notifyAgentBooked(input: AgentBookedInput): Promise<void> {
  const content = agentBookedContent(input);
  if (Platform.OS === 'web') {
    useInAppBannerStore.getState().show({ id: `booked:${input.callId}`, ...content });
    return;
  }
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  ensureForegroundHandler();
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content,
    // null trigger = show now; channel only matters on Android.
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

const bookedId = (callId: string) => `booked:${callId}`;

/**
 * Simulated calls end at a scripted, known moment: hand the notification to the OS up front, so
 * it is delivered even while iOS suspends the app (locked phone, Notification Centre open).
 * Returns false when nothing was scheduled (web, no permission) — then notify on the result.
 */
export async function scheduleAgentBooked(input: AgentBookedInput, atMs: number): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  ensureForegroundHandler();
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: bookedId(input.callId),
    content: agentBookedContent(input),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(atMs),
      channelId: CHANNEL_ID,
    },
  });
  return true;
}

/** Cancel/retry-now change the scripted ending — drop the pre-scheduled notification. */
export async function cancelAgentBooked(callId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(bookedId(callId));
}
