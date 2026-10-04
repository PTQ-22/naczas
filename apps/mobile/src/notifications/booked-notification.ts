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
