import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useFacilities, type FacilitiesQuery } from '../use-facilities';

const mockGetFacilities = jest.fn();
jest.mock('@/services', () => ({
  api: { getFacilities: (...args: unknown[]) => mockGetFacilities(...args) as unknown },
}));

const query: FacilitiesQuery = {
  examId: 'colonoscopy_screening',
  province: '07',
  lat: 52.2297,
  lng: 21.0122,
  radiusKm: 25,
  sort: 'soonest',
};

const response = { examId: 'colonoscopy_screening', items: [], source: 'nfz_live' as const };

describe('useFacilities', () => {
  beforeEach(() => mockGetFacilities.mockReset());

  it('loading → success, passing the query to the shared API client', async () => {
    mockGetFacilities.mockResolvedValue(response);
    const { result } = renderHook(() => useFacilities(query));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(mockGetFacilities).toHaveBeenCalledWith(
      { ...query, limit: 20 },
      expect.objectContaining({ timeoutMs: 30_000 }),
    );
  });

  it('error → retry → success', async () => {
    mockGetFacilities.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(response);
    const { result } = renderHook(() => useFacilities(query));
    await waitFor(() => expect(result.current.status).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(mockGetFacilities).toHaveBeenCalledTimes(2);
  });

  it('a new query shows loading again until its own result arrives', async () => {
    mockGetFacilities.mockResolvedValue(response);
    const { result, rerender } = renderHook((q: FacilitiesQuery) => useFacilities(q), {
      initialProps: query,
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    rerender({ ...query, sort: 'nearest' });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('does nothing without a query', () => {
    const { result } = renderHook(() => useFacilities(null));
    expect(result.current.status).toBe('loading');
    expect(mockGetFacilities).not.toHaveBeenCalled();
  });
});
