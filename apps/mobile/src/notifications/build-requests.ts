import { addDays, format, parseISO } from 'date-fns';

import { rules } from '@naczas/rules';
import type { ExamRecord, ISODate, Plan, Profile } from '@naczas/shared';

import { t } from '@/i18n';

export type NotificationKind = 'notify' | 'visit';

export interface PlannedNotification {
  /** `${profileId}:${examId}:${kind}` (docs/05 §4) — stable, so re-syncing is idempotent */
  id: string;
  kind: NotificationKind;
  profileId: string;
  examId: string;
  /** Local time the OS should show it */
  at: Date;
  title: string;
  body: string;
}

export interface BuildInput {
  plans: readonly Plan[];
  records: readonly ExamRecord[];
  profiles: readonly Profile[];
  /** Real device time — the OS fires notifications by the real clock, even in demo mode. */
  now: Date;
}

/** iOS keeps at most 64 pending local notifications; stay below with some headroom. */
export const MAX_SCHEDULED = 60;
const HOUR = 9;

export const notificationId = (profileId: string, examId: string, kind: NotificationKind) =>
  `${profileId}:${examId}:${kind}`;

const examName = (examId: string) => rules.find((r) => r.id === examId)?.name ?? examId;
const displayDate = (date: ISODate) => format(parseISO(date), 'dd.MM.yyyy');

/** Texts shared by OS notifications and the in-app (web) banner. */
export function notifyContent(examId: string, name: string, dueDate: ISODate) {
  return {
    title: t('settings.notifications.notifyTitle', { exam: examName(examId) }),
    body: t('settings.notifications.notifyBody', { name, due: displayDate(dueDate) }),
  };
}

export function visitContent(examId: string, name: string, bookedFor: ISODate) {
  return {
    title: t('settings.notifications.visitTitle', { exam: examName(examId) }),
    body: t('settings.notifications.visitBody', { name, date: displayDate(bookedFor) }),
  };
}

/** 'YYYY-MM-DD' → that day at 09:00 local time */
export function atNineLocal(date: ISODate): Date {
  const d = parseISO(date);
  d.setHours(HOUR, 0, 0, 0);
  return d;
}

/**
 * What should be scheduled right now. Pure: same input → same list, which is what makes
 * syncNotifications() idempotent. Past dates are skipped (act_now items are visible in the app).
 */
export function buildNotificationRequests({
  plans,
  records,
  profiles,
  now,
}: BuildInput): PlannedNotification[] {
  const nameOf = (profileId: string) => profiles.find((p) => p.id === profileId)?.name ?? '';
  const out: PlannedNotification[] = [];

  for (const plan of plans) {
    for (const item of plan.items) {
      if (item.urgency === 'done' || item.urgency === 'booked') continue;
      out.push({
        id: notificationId(item.profileId, item.examId, 'notify'),
        kind: 'notify',
        profileId: item.profileId,
        examId: item.examId,
        at: atNineLocal(item.notifyDate),
        ...notifyContent(item.examId, nameOf(item.profileId), item.dueDate),
      });
    }
  }

  const planned = new Set(plans.map((p) => p.profileId));
  for (const record of records) {
    if (record.status !== 'booked' || !record.bookedFor || !planned.has(record.profileId)) continue;
    out.push({
      id: notificationId(record.profileId, record.examId, 'visit'),
      kind: 'visit',
      profileId: record.profileId,
      examId: record.examId,
      at: atNineLocal(format(addDays(parseISO(record.bookedFor), -1), 'yyyy-MM-dd')),
      ...visitContent(record.examId, nameOf(record.profileId), record.bookedFor),
    });
  }

  return out
    .filter((n) => n.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}
