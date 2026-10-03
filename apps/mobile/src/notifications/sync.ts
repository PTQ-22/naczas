import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n';

import {
  buildNotificationRequests,
  type BuildInput,
  type PlannedNotification,
} from './build-requests';

export const CHANNEL_ID = 'reminders';
/** Marks notifications created by this module, so sync never touches anything else. */
const SOURCE = 'naczas';

export type SyncResult =
  | { status: 'synced'; scheduled: number; cancelled: number; kept: number }
  | { status: 'skipped'; reason: 'web' | 'no-permission' };

interface OurData {
  source: typeof SOURCE;
  at: string;
  title: string;
  body: string;
}

function ourData(data: unknown): OurData | null {
  const d = data as Partial<OurData> | null | undefined;
  return d?.source === SOURCE ? (d as OurData) : null;
}

const sameContent = (planned: PlannedNotification, data: OurData) =>
  data.at === planned.at.toISOString() &&
  data.title === planned.title &&
  data.body === planned.body;

let handlerSet = false;

/**
 * Without a handler the OS stays silent while the app is in the foreground — the demo test
 * notification would never appear. Set once, lazily (the app root belongs to WS3).
 */
export function ensureForegroundHandler(): void {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
  });
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t('settings.notifications.channelName'),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Makes the OS schedule match the plans: cancels our notifications that are gone or changed,
 * schedules new/changed ones, leaves identical ones alone. Safe to call on every app open and
 * plan change. Never asks for permission itself — see requestNotificationPermission().
 */
export async function syncNotifications(input: BuildInput): Promise<SyncResult> {
  if (Platform.OS === 'web') return { status: 'skipped', reason: 'web' };
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return { status: 'skipped', reason: 'no-permission' };

  ensureForegroundHandler();
  await ensureAndroidChannel();
  const wanted = new Map(buildNotificationRequests(input).map((n) => [n.id, n]));
  const existing = await Notifications.getAllScheduledNotificationsAsync();

  let cancelled = 0;
  const unchanged = new Set<string>();
  for (const request of existing) {
    const data = ourData(request.content.data);
    if (!data) continue;
    const planned = wanted.get(request.identifier);
    if (planned && sameContent(planned, data)) {
      unchanged.add(request.identifier);
    } else {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      cancelled += 1;
    }
  }

  let scheduled = 0;
  for (const planned of wanted.values()) {
    if (unchanged.has(planned.id)) continue;
    const data: OurData & Record<string, unknown> = {
      source: SOURCE,
      at: planned.at.toISOString(),
      title: planned.title,
      body: planned.body,
      profileId: planned.profileId,
      examId: planned.examId,
      kind: planned.kind,
    };
    await Notifications.scheduleNotificationAsync({
      identifier: planned.id,
      content: { title: planned.title, body: planned.body, data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: planned.at,
        channelId: CHANNEL_ID,
      },
    });
    scheduled += 1;
  }

  return { status: 'synced', scheduled, cancelled, kept: unchanged.size };
}

/** Settings → "Delete all data": remove our pending reminders too (they contain health info). */
export async function cancelAllOurNotifications(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const ours = existing.filter((r) => ourData(r.content.data));
  for (const r of ours) await Notifications.cancelScheduledNotificationAsync(r.identifier);
  return ours.length;
}
