import { render } from '@testing-library/react-native';

import { useSettingsStore } from '@/store/settings-store';

import { AutoSync } from '../AutoSync';
import { useSyncStatus } from '../cloud-sync';

const mockSyncFamily = jest.fn<Promise<{ profileCount: number }>, [string]>();
jest.mock('../cloud-sync', () => {
  const actual = jest.requireActual<typeof import('../cloud-sync')>('../cloud-sync');
  return {
    ...actual,
    syncFamily: (code: string) => mockSyncFamily(code),
    pushNow: jest.fn(() => Promise.resolve()),
  };
});
jest.mock('@/store', () => ({
  ...jest.requireActual<typeof import('@/store')>('@/store'),
  useStoresHydrated: () => true,
}));

describe('AutoSync', () => {
  beforeEach(() => {
    mockSyncFamily.mockReset().mockResolvedValue({ profileCount: 1 });
    useSyncStatus.setState({ syncing: false, lastSync: null, error: null, initialSyncFor: null });
    // A code persisted by an older (sync-enabled) build.
    useSettingsStore.setState({ familyCode: 'ABC' });
  });
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_ENABLE_SYNC;
  });

  it('flag off (default): does not sync even with a stored family code', () => {
    delete process.env.EXPO_PUBLIC_ENABLE_SYNC;
    render(<AutoSync />);
    expect(mockSyncFamily).not.toHaveBeenCalled();
  });

  it('flag on: runs the first full sync for the stored family code', () => {
    process.env.EXPO_PUBLIC_ENABLE_SYNC = '1';
    render(<AutoSync />);
    expect(mockSyncFamily).toHaveBeenCalledWith('ABC');
  });
});
