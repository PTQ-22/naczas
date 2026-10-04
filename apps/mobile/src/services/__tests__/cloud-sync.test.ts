import { mockProfileMama } from '@naczas/rules';
import type { ExamRecord } from '@naczas/shared';

import { useProfilesStore, useRecordsStore } from '@/store';

import { applyFamily, parseFamily, syncFamily, useSyncStatus } from '../cloud-sync';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mama = { ...mockProfileMama, id: 'p1' };
const booked: ExamRecord = {
  profileId: 'p1',
  examId: 'mammography',
  status: 'booked',
  bookedFor: '2026-10-20',
  updatedAt: '2026-10-04',
};

const json = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe('parseFamily', () => {
  it('turns NULL columns into absent fields (they used to wipe the records on restart)', () => {
    const family = parseFamily({
      profiles: [mama],
      records: [{ ...booked, lastDone: null, bookedTime: null }],
    });
    expect(family.records).toEqual([booked]);
  });

  it('drops invalid profiles and records of unknown profiles, keeps the rest', () => {
    const family = parseFamily({
      profiles: [mama, { id: 'broken' }],
      records: [booked, { ...booked, profileId: 'broken' }, { nonsense: true }],
    });
    expect(family.profiles.map((p) => p.id)).toEqual(['p1']);
    expect(family.records).toEqual([booked]);
  });

  it('rejects a response that is not a family at all', () => {
    expect(() => parseFamily({ error: 'x' })).toThrow();
  });
});

describe('applyFamily / syncFamily', () => {
  let fetchMock: jest.Mock<Promise<Response>, [string, RequestInit?]>;
  beforeEach(() => {
    useProfilesStore.setState({ profiles: [], activeProfileId: null });
    useRecordsStore.setState({ records: [] });
    useSyncStatus.setState({ syncing: false, lastSync: null, error: null, initialSyncFor: null });
    fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();
    // Our code only ever calls fetch(url: string, init).
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('an empty cloud never wipes local data', () => {
    useProfilesStore.setState({ profiles: [mama], activeProfileId: 'p1' });
    applyFamily({ profiles: [], records: [] });
    expect(useProfilesStore.getState().profiles).toEqual([mama]);
  });

  it('fresh device: pulls the family and reports how many profiles it got', async () => {
    fetchMock.mockImplementation(() => json({ profiles: [mama], records: [booked] }));
    await expect(syncFamily('ABC')).resolves.toEqual({ profileCount: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1); // nothing local → no push
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/v1/sync/pull/ABC');
    expect(useProfilesStore.getState().activeProfileId).toBe('p1');
    expect(useRecordsStore.getState().records).toEqual([booked]);
    expect(useSyncStatus.getState()).toMatchObject({ syncing: false, initialSyncFor: 'ABC' });
  });

  it('device with data: pushes first, so logging in never loses local data', async () => {
    useProfilesStore.setState({ profiles: [mama], activeProfileId: 'p1' });
    useRecordsStore.setState({ records: [booked] });
    fetchMock.mockImplementation((url) =>
      String(url).includes('/push')
        ? json({ success: true })
        : json({ profiles: [mama], records: [] }),
    );
    await syncFamily('ABC');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/v1/sync/push');
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      familyCode: string;
      records: unknown[];
    };
    expect(body).toMatchObject({ familyCode: 'ABC', records: [booked] });
  });

  it('a failed sync is reported in the status and rethrown', async () => {
    fetchMock.mockImplementation(() => json({}, 500));
    await expect(syncFamily('ABC')).rejects.toThrow('HTTP 500');
    expect(useSyncStatus.getState()).toMatchObject({ syncing: false, initialSyncFor: null });
    expect(useSyncStatus.getState().error).toContain('500');
  });
});
