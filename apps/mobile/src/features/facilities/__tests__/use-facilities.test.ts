import { act, renderHook, waitFor } from '@testing-library/react-native';

import { fetchFacilities, useFacilities, type FacilitiesQuery } from '../use-facilities';

const mockConfig = { baseUrl: 'https://api.test', useMocks: false };
jest.mock('../api-config', () => ({ apiConfig: () => mockConfig }));

const query: FacilitiesQuery = {
  examId: 'colonoscopy_screening',
  province: '07',
  lat: 52.2297,
  lng: 21.0122,
  radiusKm: 25,
  sort: 'soonest',
};

const validBody = {
  examId: 'colonoscopy_screening',
  source: 'nfz_live',
  items: [
    {
      id: 'q1',
      benefit: 'KOLONOSKOPIA',
      providerName: 'Szpital',
      placeName: 'Pracownia',
      address: 'Ulica 1',
      locality: 'Warszawa',
      phone: null,
      lat: 52.2,
      lng: 21,
      distanceKm: 2,
      firstAvailableDate: null,
      waitDays: 30,
      awaiting: null,
      accessibility: { ramp: false, elevator: false, parking: false, toilet: false },
      asOf: '2026-09-01',
    },
  ],
};

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe('fetchFacilities', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    mockConfig.useMocks = false;
    fetchMock = jest.fn(() => jsonResponse(validBody));
    global.fetch = fetchMock;
  });

  it('calls /v1/facilities with coordinates rounded to ~1 km', async () => {
    await fetchFacilities(query);
    const [[url]] = fetchMock.mock.calls as [[string]];
    expect(url.startsWith('https://api.test/v1/facilities?')).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get('lat')).toBe('52.23');
    expect(params.get('lng')).toBe('21.01');
    expect(params.get('sort')).toBe('soonest');
    expect(params.get('radiusKm')).toBe('25');
    expect(params.get('province')).toBe('07');
  });

  it('validates the response with the shared schema', async () => {
    await expect(fetchFacilities(query)).resolves.toMatchObject({ source: 'nfz_live' });
    fetchMock.mockReturnValueOnce(jsonResponse({ items: 'nope' }));
    await expect(fetchFacilities(query)).rejects.toThrow();
  });

  it('throws on HTTP errors', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ error: { code: 'x', message: 'y' } }, 503));
    await expect(fetchFacilities(query)).rejects.toThrow('HTTP 503');
  });

  it('mock mode: no network, recorded data marked as snapshot, sorted', async () => {
    mockConfig.useMocks = true;
    const soonest = await fetchFacilities(query);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(soonest.source).toBe('nfz_snapshot');
    expect(soonest.items.length).toBeGreaterThan(0);
    const waits = soonest.items.map((f) => f.waitDays ?? Infinity);
    expect(waits).toEqual([...waits].sort((a, b) => a - b));

    const nearest = await fetchFacilities({ ...query, sort: 'nearest' });
    const km = nearest.items.map((f) => f.distanceKm);
    expect(km).toEqual([...km].sort((a, b) => a - b));

    expect((await fetchFacilities({ ...query, examId: 'mammography' })).items).toEqual([]);
  });
});

describe('useFacilities', () => {
  beforeEach(() => {
    mockConfig.useMocks = false;
  });

  it('loading → success', async () => {
    global.fetch = jest.fn(() => jsonResponse(validBody));
    const { result } = renderHook(() => useFacilities(query));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('error → retry → success', async () => {
    const fetchMock = jest
      .fn()
      .mockReturnValueOnce(Promise.reject(new Error('offline')))
      .mockReturnValue(jsonResponse(validBody));
    global.fetch = fetchMock;
    const { result } = renderHook(() => useFacilities(query));
    await waitFor(() => expect(result.current.status).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does nothing without a query', () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() => useFacilities(null));
    expect(result.current.status).toBe('loading');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
