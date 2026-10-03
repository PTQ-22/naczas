import { Platform } from 'react-native';

import type { Plan, PlanItem } from '@naczas/shared';

import { makeProfile, makeRecord } from '@/store/__fixtures__/fixtures';

import {
  buildNotificationRequests,
  cancelAllOurNotifications,
  dueReminders,
  MAX_SCHEDULED,
  requestNotificationPermission,
  sendTestNotification,
  syncNotifications,
} from '..';
import { useInAppBannerStore } from '../in-app';

// In-memory stand-in for the OS scheduler.
const mockScheduled = new Map<
  string,
  { content: { data?: unknown; title?: string }; trigger: unknown }
>();
let mockPermission = { granted: true, canAskAgain: true };

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  getPermissionsAsync: jest.fn(() => Promise.resolve(mockPermission)),
  requestPermissionsAsync: jest.fn(() => {
    mockPermission = { granted: true, canAskAgain: true };
    return Promise.resolve(mockPermission);
  }),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  setNotificationHandler: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() =>
    Promise.resolve([...mockScheduled].map(([identifier, r]) => ({ identifier, ...r }))),
  ),
  scheduleNotificationAsync: jest.fn(
    (req: { identifier?: string; content: { data?: unknown }; trigger: unknown }) => {
      const id = req.identifier ?? `os-${mockScheduled.size}`;
      mockScheduled.set(id, { content: req.content, trigger: req.trigger });
      return Promise.resolve(id);
    },
  ),
  cancelScheduledNotificationAsync: jest.fn((id: string) => {
    mockScheduled.delete(id);
    return Promise.resolve();
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- the jest.mock above, typed
const Notifications = require('expo-notifications') as {
  scheduleNotificationAsync: jest.Mock;
  cancelScheduledNotificationAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
};

const NOW = new Date(2026, 9, 4, 10, 0); // 2026-10-04 10:00 local
const mama = makeProfile();

const item = (overrides: Partial<PlanItem>): PlanItem => ({
  examId: 'colonoscopy_screening',
  profileId: mama.id,
  dueDate: '2027-03-01',
  notifyDate: '2026-12-01',
  leadTimeDays: 90,
  leadTimeSource: 'nfz_live',
  urgency: 'this_year',
  reasons: [],
  overdue: false,
  ...overrides,
});

const planWith = (...items: PlanItem[]): Plan => ({
  profileId: mama.id,
  generatedAt: '2026-10-04',
  items,
});

const input = (plans: Plan[], records = [makeRecord()]) => ({
  plans,
  records,
  profiles: [mama],
  now: NOW,
});

beforeEach(() => {
  mockScheduled.clear();
  mockPermission = { granted: true, canAskAgain: true };
  jest.clearAllMocks();
  Platform.OS = 'ios';
});

describe('buildNotificationRequests', () => {
  it('plans notifyDate 09:00 and bookedFor − 1 day 09:00 with stable ids', () => {
    const plans = [planWith(item({}), item({ examId: 'dental_checkup', urgency: 'booked' }))];
    const records = [
      makeRecord({ examId: 'dental_checkup', status: 'booked', bookedFor: '2026-11-20' }),
    ];
    const out = buildNotificationRequests(input(plans, records));

    expect(
      out.map((n) => [
        n.id,
        n.at.getFullYear(),
        n.at.getMonth() + 1,
        n.at.getDate(),
        n.at.getHours(),
      ]),
    ).toEqual([
      ['p-mama:dental_checkup:visit', 2026, 11, 19, 9],
      ['p-mama:colonoscopy_screening:notify', 2026, 12, 1, 9],
    ]);
    expect(out[1]?.title).toBe('Kolonoskopia — czas się umówić');
    expect(out[1]?.body).toBe('Mama: zacznij szukać terminu, żeby zdążyć do 01.03.2027.');
  });

  it('skips past dates, done/booked plan items, and caps the count for iOS', () => {
    expect(
      buildNotificationRequests(input([planWith(item({ notifyDate: '2026-10-01' }))])),
    ).toEqual([]);
    expect(buildNotificationRequests(input([planWith(item({ urgency: 'done' }))]))).toEqual([]);

    const many = Array.from({ length: 80 }, (_, i) =>
      item({ examId: `exam_${i}`, notifyDate: `2027-0${(i % 9) + 1}-10` }),
    );
    expect(buildNotificationRequests(input([planWith(...many)]))).toHaveLength(MAX_SCHEDULED);
  });
});

describe('syncNotifications', () => {
  it('schedules, then is idempotent on an unchanged plan', async () => {
    const plans = [planWith(item({}))];
    expect(await syncNotifications(input(plans))).toEqual({
      status: 'synced',
      scheduled: 1,
      cancelled: 0,
      kept: 0,
    });
    expect([...mockScheduled.keys()]).toEqual(['p-mama:colonoscopy_screening:notify']);

    jest.clearAllMocks();
    expect(await syncNotifications(input(plans))).toMatchObject({
      scheduled: 0,
      cancelled: 0,
      kept: 1,
    });
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('reschedules a changed date and cancels reminders that are no longer planned', async () => {
    await syncNotifications(input([planWith(item({}), item({ examId: 'eye_exam' }))]));

    const result = await syncNotifications(input([planWith(item({ notifyDate: '2026-12-15' }))]));

    expect(result).toMatchObject({ scheduled: 1, cancelled: 2, kept: 0 });
    expect([...mockScheduled.keys()]).toEqual(['p-mama:colonoscopy_screening:notify']);
    const trigger = mockScheduled.get('p-mama:colonoscopy_screening:notify')?.trigger as {
      date: Date;
    };
    expect(trigger.date.getDate()).toBe(15);
  });

  it('never touches notifications it did not create', async () => {
    mockScheduled.set('other-app-reminder', { content: { data: { foo: 1 } }, trigger: null });
    await syncNotifications(input([]));
    await cancelAllOurNotifications();
    expect(mockScheduled.has('other-app-reminder')).toBe(true);
  });

  it('does nothing without permission and never prompts by itself', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    expect(await syncNotifications(input([planWith(item({}))]))).toEqual({
      status: 'skipped',
      reason: 'no-permission',
    });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockScheduled.size).toBe(0);
  });

  it('skips on web', async () => {
    Platform.OS = 'web';
    expect(await syncNotifications(input([planWith(item({}))]))).toEqual({
      status: 'skipped',
      reason: 'web',
    });
  });
});

describe('permission and test notification', () => {
  it('asks only when the OS still allows asking', async () => {
    mockPermission = { granted: false, canAskAgain: false };
    expect(await requestNotificationPermission()).toBe('denied');
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();

    mockPermission = { granted: false, canAskAgain: true };
    expect(await requestNotificationPermission()).toBe('granted');
  });

  it('sends a real notification on native and an in-app banner on web', async () => {
    expect(await sendTestNotification()).toBe('sent');
    const [request] = Notifications.scheduleNotificationAsync.mock.calls[0] as [
      { trigger: { type: string } },
    ];
    expect(request.trigger.type).toBe('timeInterval');

    Platform.OS = 'web';
    expect(await sendTestNotification()).toBe('in-app');
    expect(useInAppBannerStore.getState().extra.map((b) => b.title)).toEqual([
      'Test przypomnień NaCzas',
    ]);
  });
});

describe('dueReminders (in-app, web)', () => {
  it('shows act_now items and visits from the day before', () => {
    const plans = [planWith(item({ urgency: 'act_now' }), item({ examId: 'eye_exam' }))];
    const records = [
      makeRecord({ examId: 'dental_checkup', status: 'booked', bookedFor: '2026-10-05' }),
    ];
    const ids = (today: string) =>
      dueReminders({ plans, records, profiles: [mama], today }).map((r) => r.id);

    expect(ids('2026-10-04')).toEqual([
      'p-mama:colonoscopy_screening:notify',
      'p-mama:dental_checkup:visit',
    ]);
    expect(ids('2026-10-03')).toEqual(['p-mama:colonoscopy_screening:notify']);
    expect(ids('2026-10-06')).toEqual(['p-mama:colonoscopy_screening:notify']);
  });
});
