import type { WaitTimeSummary } from '@naczas/shared';

import { makeProfile } from '@/store/__fixtures__/fixtures';

import { ApiRequestError, type ApiClient } from '../api';
import { createWaitTimesLoader, LAST_RESULT_KEY, queueExamIds, waitTimesKey } from '../wait-times';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const location = { province: '07', lat: 52.2297, lng: 21.0122, label: 'Warszawa' } as const;

const summary = (examId: string): WaitTimeSummary => ({
  examId,
  province: '07',
  radiusKm: 15,
  facilitiesCount: 10,
  p50Days: 60,
  p75Days: 90,
  minDays: 5,
  asOf: '2026-09',
  source: 'nfz_live',
});

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: jest.fn((key: string) => Promise.resolve(data.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      data.set(key, value);
      return Promise.resolve();
    }),
  };
}

function fakeApi(getWaitTimes: ApiClient['getWaitTimes']): ApiClient {
  return {
    getWaitTimes: jest.fn(getWaitTimes),
    getFacilities: jest.fn(),
    getCoverage: jest.fn(),
    startCallAssist: jest.fn(),
    getCallAssist: jest.fn(),
  };
}

const offline = () => Promise.reject(new ApiRequestError('network', 'offline'));

describe('queueExamIds', () => {
  it('keeps only exams booked through NFZ queues', () => {
    const ids = queueExamIds(makeProfile(), '2026-10-04');
    expect(ids).toContain('colonoscopy_screening');
    expect(ids).not.toContain('mammography');
  });
});

describe('waitTimesLoader', () => {
  it('fetches each exam once and serves repeats from memory', async () => {
    const api = fakeApi(({ examId }) => Promise.resolve(summary(examId)));
    const loader = createWaitTimesLoader({ api, storage: memoryStorage() });

    await loader.load(['colonoscopy_screening', 'dental_checkup'], location);
    const second = await loader.load(['colonoscopy_screening'], location);

    expect(api.getWaitTimes).toHaveBeenCalledTimes(2);
    expect(second).toEqual({
      waitTimes: { colonoscopy_screening: summary('colonoscopy_screening') },
      offline: false,
    });
  });

  it('refetches after the memory TTL or when forced', async () => {
    let now = 0;
    const api = fakeApi(({ examId }) => Promise.resolve(summary(examId)));
    const loader = createWaitTimesLoader({ api, storage: memoryStorage(), now: () => now });

    await loader.load(['eye_exam'], location);
    await loader.load(['eye_exam'], location, { force: true });
    now = 25 * 60 * 60 * 1000;
    await loader.load(['eye_exam'], location);

    expect(api.getWaitTimes).toHaveBeenCalledTimes(3);
  });

  it('sends only rounded coordinates via the API client', async () => {
    const api = fakeApi(({ examId }) => Promise.resolve(summary(examId)));
    await createWaitTimesLoader({ api, storage: memoryStorage() }).load(['eye_exam'], location);

    expect(api.getWaitTimes).toHaveBeenCalledWith(
      { examId: 'eye_exam', province: '07', lat: location.lat, lng: location.lng },
      expect.anything(),
    );
  });

  it('remembers the last result and serves it as a snapshot when offline', async () => {
    const storage = memoryStorage();
    await createWaitTimesLoader({
      api: fakeApi(({ examId }) => Promise.resolve(summary(examId))),
      storage,
    }).load(['colonoscopy_screening'], location);

    const result = await createWaitTimesLoader({ api: fakeApi(offline), storage }).load(
      ['colonoscopy_screening'],
      location,
    );

    expect(result.offline).toBe(true);
    expect(result.waitTimes.colonoscopy_screening).toEqual({
      ...summary('colonoscopy_screening'),
      source: 'nfz_snapshot',
    });
  });

  it('leaves the exam to default lead time when offline with nothing remembered', async () => {
    const result = await createWaitTimesLoader({
      api: fakeApi(offline),
      storage: memoryStorage({ [LAST_RESULT_KEY]: '{corrupted' }),
    }).load(['colonoscopy_screening'], location);

    expect(result).toEqual({ waitTimes: {}, offline: true });
  });

  it('does not report offline for exams the API does not serve', async () => {
    const api = fakeApi(() =>
      Promise.reject(new ApiRequestError('http', 'unknown', 400, 'unknown_exam')),
    );
    const result = await createWaitTimesLoader({ api, storage: memoryStorage() }).load(
      ['skin_check'],
      location,
    );

    expect(result).toEqual({ waitTimes: {}, offline: false });
  });

  it('keys the cache by rounded location', () => {
    expect(waitTimesKey('eye_exam', location)).toBe('eye_exam|07|52.23|21.01');
  });
});
