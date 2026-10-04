import type { CallAssistStatus } from '@naczas/shared';

import { ApiRequestError } from '@/services/api';
import { savedTime, useCallTasksStore, useRecordsStore } from '@/store';

import { applyStatus, pollTask, startCallTask } from '../call-tasks';

const mockGet = jest.fn();
jest.mock('@/services', () => ({
  api: {
    startCallAssist: () => Promise.resolve({ callId: 'c1', mode: 'simulated' }),
    getCallAssist: (...a: unknown[]) => mockGet(...a) as unknown,
  },
}));
const mockNotify = jest.fn((_input: unknown) => Promise.resolve());
jest.mock('@/notifications', () => ({
  notifyAgentBooked: (input: unknown) => mockNotify(input),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const status = (over: Partial<CallAssistStatus>): CallAssistStatus => ({
  callId: 'c1',
  status: 'in_progress',
  transcript: [],
  result: null,
  stats: { attempts: 1, waitedSec: 30, talkedSec: 10 },
  ...over,
});
const task = () => useCallTasksStore.getState().tasks[0]!;

describe('call tasks', () => {
  beforeEach(async () => {
    useCallTasksStore.getState().reset();
    useRecordsStore.setState({ records: [] });
    mockGet.mockReset();
    mockNotify.mockClear();
    await startCallTask(
      {
        request: { examName: 'x', facilityName: 'Y', forWhom: 'mamę', callerName: 'Kasi' },
        profileId: 'p1',
        examId: 'neurolog',
        facilityName: 'Y',
      },
      1000,
    );
  });

  it('starts as an active, queued task', () => {
    expect(task()).toMatchObject({ id: 'c1', status: 'queued', closed: false, profileId: 'p1' });
  });

  it('a booked result is written to the plan exactly once and closes the task', () => {
    const booked = status({
      status: 'ended',
      result: { booked: true, date: '2026-10-20', time: '17:00', note: null },
    });
    applyStatus(task(), booked, 2000);
    applyStatus(task(), booked, 3000);
    expect(useRecordsStore.getState().records).toEqual([
      expect.objectContaining({ profileId: 'p1', examId: 'neurolog', bookedFor: '2026-10-20' }),
    ]);
    expect(task()).toMatchObject({ applied: true, closed: true });
  });

  it('a booked result notifies once, with the hour and the facility', () => {
    const booked = status({
      status: 'ended',
      result: { booked: true, date: '2026-10-20', time: '17:00', note: null },
    });
    applyStatus(task(), booked, 2000);
    applyStatus(task(), booked, 3000);
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        callId: 'c1',
        examId: 'neurolog',
        date: '2026-10-20',
        time: '17:00',
        facilityName: 'Y',
      }),
    );
  });

  it('keeps polling while the call is on, closes on failure', () => {
    applyStatus(task(), status({ status: 'retry_scheduled' }), 2000);
    expect(task().closed).toBe(false);
    applyStatus(task(), status({ status: 'failed' }), 3000);
    expect(task().closed).toBe(true);
  });

  it('an id the server forgot (restart) closes the task as failed', async () => {
    mockGet.mockRejectedValue(new ApiRequestError('http', 'Unknown call id', 404, 'unknown_call'));
    await pollTask('c1', 2000);
    expect(task()).toMatchObject({ status: 'failed', closed: true });
  });

  it('a network hiccup keeps the task active', async () => {
    mockGet.mockRejectedValue(new ApiRequestError('network', 'offline'));
    await pollTask('c1', 2000);
    expect(task().closed).toBe(false);
  });

  it('sums the measured phone time over all tasks', () => {
    applyStatus(
      task(),
      status({
        status: 'ended',
        result: { booked: true, date: '2026-10-20', time: null, note: null },
      }),
      2000,
    );
    expect(savedTime(useCallTasksStore.getState().tasks)).toEqual({
      waitedSec: 30,
      talkedSec: 10,
      totalSec: 40,
      attempts: 1,
      booked: 1,
    });
  });
});
