import { act, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import type { Plan } from '@naczas/shared';

import { resetAllData, useProfilesStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';

import { NotificationSync } from '../NotificationSync';

// usePlan driven by the test: profileId → { plan, status }
const mockPlanState: Record<string, { plan: Plan; status: 'loading' | 'ready' | 'offline' }> = {};
jest.mock('@/services', () => ({
  usePlan: (profileId: string) => mockPlanState[profileId],
}));

const mockScheduled = new Map<string, { content: { data?: unknown } }>();
jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  getAllScheduledNotificationsAsync: jest.fn(() =>
    Promise.resolve([...mockScheduled].map(([identifier, r]) => ({ identifier, ...r }))),
  ),
  scheduleNotificationAsync: jest.fn((req: { identifier: string; content: { data?: unknown } }) => {
    mockScheduled.set(req.identifier, { content: req.content });
    return Promise.resolve(req.identifier);
  }),
  cancelScheduledNotificationAsync: jest.fn((id: string) => {
    mockScheduled.delete(id);
    return Promise.resolve();
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- the jest.mock above, typed
const Notifications = require('expo-notifications') as { getPermissionsAsync: jest.Mock };

const mama = makeProfile({ id: 'p-mama', name: 'Mama' });
const kasia = makeProfile({ id: 'p-kasia', name: 'Kasia', relation: 'self', birthYear: 1994 });

const planFor = (profileId: string): Plan => ({
  profileId,
  generatedAt: '2026-10-04',
  items: [
    {
      examId: 'colonoscopy_screening',
      profileId,
      dueDate: '2099-03-01',
      notifyDate: '2099-01-10', // far future → always schedulable
      leadTimeDays: 50,
      leadTimeSource: 'nfz_live',
      urgency: 'later',
      reasons: [],
      overdue: false,
    },
  ],
});

const ids = () => [...mockScheduled.keys()].sort();

beforeEach(() => {
  resetAllData();
  mockScheduled.clear();
  jest.clearAllMocks();
  Platform.OS = 'ios';
  for (const p of [mama, kasia]) {
    mockPlanState[p.id] = { plan: planFor(p.id), status: 'ready' };
    useProfilesStore.getState().addProfile(p);
  }
});

describe('NotificationSync', () => {
  it('schedules reminders for every person on the device', async () => {
    render(<NotificationSync />);
    await waitFor(() =>
      expect(ids()).toEqual([
        'p-kasia:colonoscopy_screening:notify',
        'p-mama:colonoscopy_screening:notify',
      ]),
    );
  });

  it('waits until every plan has settled, so it never syncs a partial list', async () => {
    mockPlanState[kasia.id] = { plan: planFor(kasia.id), status: 'loading' };
    const view = render(<NotificationSync />);
    await waitFor(() => expect(useProfilesStore.persist.hasHydrated()).toBe(true));
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();

    mockPlanState[kasia.id] = { plan: planFor(kasia.id), status: 'offline' };
    view.rerender(<NotificationSync />);
    await waitFor(() => expect(ids()).toHaveLength(2));
  });

  it('cancels the reminders of a removed person', async () => {
    const view = render(<NotificationSync />);
    await waitFor(() => expect(ids()).toHaveLength(2));

    await act(async () => {
      useProfilesStore.getState().removeProfile(kasia.id);
      await Promise.resolve();
    });
    view.rerender(<NotificationSync />);
    await waitFor(() => expect(ids()).toEqual(['p-mama:colonoscopy_screening:notify']));
  });

  it('does nothing on web (no native notifications, no extra API calls)', () => {
    Platform.OS = 'web';
    const view = render(<NotificationSync />);
    expect(view.toJSON()).toBeNull();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });
});
