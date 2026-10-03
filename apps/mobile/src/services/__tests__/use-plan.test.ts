import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { WaitTimeSummary } from '@naczas/shared';

import { resetAllData, useProfilesStore, useSettingsStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';

import { ApiRequestError, type ApiClient } from '../api';
import { usePlan } from '../use-plan';
import { createWaitTimesLoader } from '../wait-times';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const TODAY = '2026-10-04';
const mama = makeProfile({
  location: { province: '07', lat: 52.23, lng: 21.01, label: 'Warszawa' },
});

const colonoscopyWait: WaitTimeSummary = {
  examId: 'colonoscopy_screening',
  province: '07',
  radiusKm: 15,
  facilitiesCount: 35,
  p50Days: 120,
  p75Days: 200,
  minDays: 3,
  asOf: '2026-09',
  source: 'nfz_live',
};

function loaderWith(getWaitTimes: ApiClient['getWaitTimes']) {
  const api: ApiClient = { getWaitTimes: jest.fn(getWaitTimes), getFacilities: jest.fn() };
  return { api, loader: createWaitTimesLoader({ api, storage: AsyncStorage }) };
}

const colonoscopy = (plan: ReturnType<typeof usePlan>['plan']) =>
  plan?.items.find((i) => i.examId === 'colonoscopy_screening');

beforeEach(async () => {
  await AsyncStorage.clear();
  resetAllData();
  useSettingsStore.getState().setTodayOverride(TODAY);
});

describe('usePlan', () => {
  it('returns null for an unknown profile', () => {
    const { loader } = loaderWith(() => Promise.resolve(colonoscopyWait));
    const { result } = renderHook(() => usePlan('nobody', loader));
    expect(result.current.plan).toBeNull();
  });

  it('plans with defaults at once, then with NFZ wait times', async () => {
    useProfilesStore.getState().addProfile(mama);
    const { loader } = loaderWith(({ examId }) =>
      examId === 'colonoscopy_screening'
        ? Promise.resolve(colonoscopyWait)
        : Promise.reject(new ApiRequestError('http', 'unknown', 400, 'unknown_exam')),
    );

    const { result } = renderHook(() => usePlan(mama.id, loader));
    expect(result.current.loading).toBe(true);
    expect(result.current.plan?.generatedAt).toBe(TODAY);
    expect(colonoscopy(result.current.plan)?.leadTimeSource).toBe('default');

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(colonoscopy(result.current.plan)?.leadTimeSource).toBe('nfz_live');
    expect(result.current.offline).toBe(false);
  });

  it('flags offline and keeps default lead times when the API is down', async () => {
    useProfilesStore.getState().addProfile(mama);
    const { loader } = loaderWith(() =>
      Promise.reject(new ApiRequestError('http', 'down', 503, 'data_unavailable')),
    );

    const { result } = renderHook(() => usePlan(mama.id, loader));

    await waitFor(() => expect(result.current.offline).toBe(true));
    expect(colonoscopy(result.current.plan)?.leadTimeSource).toBe('default');
  });

  it('skips the API entirely without a location', () => {
    useProfilesStore.getState().addProfile(makeProfile());
    const { api, loader } = loaderWith(() => Promise.resolve(colonoscopyWait));

    const { result } = renderHook(() => usePlan(mama.id, loader));

    expect(result.current.loading).toBe(false);
    expect(result.current.plan).not.toBeNull();
    expect(api.getWaitTimes).not.toHaveBeenCalled();
  });

  it('recomputes when the demo date changes', async () => {
    useProfilesStore.getState().addProfile(mama);
    const { loader } = loaderWith(() => Promise.resolve(colonoscopyWait));
    const { result } = renderHook(() => usePlan(mama.id, loader));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      useSettingsStore.getState().setTodayOverride('2027-01-11');
    });

    expect(result.current.plan?.generatedAt).toBe('2027-01-11');
  });
});
