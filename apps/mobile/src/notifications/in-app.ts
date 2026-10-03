import { addDays, format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { create } from 'zustand';

import type { ExamRecord, ISODate, Plan, Profile } from '@naczas/shared';

import { useProfilesStore, useRecordsStore, useToday } from '@/store';

import { notificationId, notifyContent, visitContent } from './build-requests';

export interface InAppReminder {
  id: string;
  title: string;
  body: string;
}

/**
 * Reminders that are due "today" (demo-aware) — what a native notification would have shown.
 * Used on web, which has no native local notifications.
 */
export function dueReminders(input: {
  plans: readonly Plan[];
  records: readonly ExamRecord[];
  profiles: readonly Profile[];
  today: ISODate;
}): InAppReminder[] {
  const nameOf = (id: string) => input.profiles.find((p) => p.id === id)?.name ?? '';
  const planned = new Set(input.plans.map((p) => p.profileId));
  const out: InAppReminder[] = [];

  for (const plan of input.plans) {
    for (const item of plan.items) {
      if (item.urgency !== 'act_now') continue;
      out.push({
        id: notificationId(item.profileId, item.examId, 'notify'),
        ...notifyContent(item.examId, nameOf(item.profileId), item.dueDate),
      });
    }
  }
  for (const r of input.records) {
    if (r.status !== 'booked' || !r.bookedFor || !planned.has(r.profileId)) continue;
    const dayBefore = format(addDays(parseISO(r.bookedFor), -1), 'yyyy-MM-dd');
    if (input.today < dayBefore || input.today > r.bookedFor) continue;
    out.push({
      id: notificationId(r.profileId, r.examId, 'visit'),
      ...visitContent(r.examId, nameOf(r.profileId), r.bookedFor),
    });
  }
  return out;
}

interface InAppBannerState {
  /** Ad-hoc banners, e.g. the demo test notification on web */
  extra: InAppReminder[];
  /** Dismissed for this session only — in-app reminders come back on the next app start */
  dismissed: readonly string[];
  show: (banner: InAppReminder) => void;
  dismiss: (id: string) => void;
}

export const useInAppBannerStore = create<InAppBannerState>()((set) => ({
  extra: [],
  dismissed: [],
  show: (banner) =>
    set((s) => ({
      extra: [...s.extra.filter((b) => b.id !== banner.id), banner],
      dismissed: s.dismissed.filter((id) => id !== banner.id),
    })),
  dismiss: (id) =>
    set((s) => ({ dismissed: [...s.dismissed, id], extra: s.extra.filter((b) => b.id !== id) })),
}));

/**
 * For an in-app banner (web): due reminders for the given plans + ad-hoc banners, minus the
 * dismissed ones. Rendering the banner is up to the screen that shows the plan.
 */
export function useInAppReminders(plans: readonly Plan[]) {
  const records = useRecordsStore((s) => s.records);
  const profiles = useProfilesStore((s) => s.profiles);
  const today = useToday();
  const extra = useInAppBannerStore((s) => s.extra);
  const dismissed = useInAppBannerStore((s) => s.dismissed);
  const dismiss = useInAppBannerStore((s) => s.dismiss);

  const reminders = useMemo(
    () =>
      [...extra, ...dueReminders({ plans, records, profiles, today })].filter(
        (r) => !dismissed.includes(r.id),
      ),
    [extra, plans, records, profiles, today, dismissed],
  );
  return { reminders, dismiss };
}
