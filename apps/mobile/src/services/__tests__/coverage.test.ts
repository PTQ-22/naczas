import { renderHook, waitFor } from '@testing-library/react-native';

import type { Coverage } from '@naczas/shared';

import { ApiRequestError } from '../api';
import { clearCoverageCache, coverageProgramFor, useCoverage } from '../coverage';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const warsaw = { province: '07' as const, lat: 52.2297, lng: 21.0122, label: 'Warszawa' };
const coverage: Coverage = {
  program: 'mammography',
  level: 'powiat',
  areaName: 'Warszawa',
  percent: 31.2,
  eligible: 417773,
  covered: 130551,
  asOf: '2026-10-01',
  source: 'https://www.nfz.gov.pl/x.xlsx',
};

describe('coverageProgramFor', () => {
  it('maps the three NFZ screening programmes and nothing else', () => {
    expect(coverageProgramFor('mammography')).toBe('mammography');
    expect(coverageProgramFor('cervical_screening')).toBe('cervical');
    expect(coverageProgramFor('colonoscopy_screening')).toBe('colonoscopy');
    expect(coverageProgramFor('dental_checkup')).toBeUndefined();
  });
});

describe('useCoverage', () => {
  beforeEach(() => clearCoverageCache());

  it('asks only for program + province + rounded coords, then caches', async () => {
    const api = { getCoverage: jest.fn().mockResolvedValue(coverage) };
    const { result } = renderHook(() => useCoverage('mammography', warsaw, api));
    await waitFor(() => expect(result.current).toEqual(coverage));
    expect(api.getCoverage).toHaveBeenCalledWith(
      { program: 'mammography', province: '07', lat: 52.2297, lng: 21.0122 },
      expect.objectContaining({ timeoutMs: 8000 }),
    );
    const again = renderHook(() => useCoverage('mammography', warsaw, api));
    await waitFor(() => expect(again.result.current).toEqual(coverage));
    expect(api.getCoverage).toHaveBeenCalledTimes(1);
  });

  it('stays null on errors and for exams without a programme', async () => {
    const api = {
      getCoverage: jest.fn().mockRejectedValue(new ApiRequestError('network', 'offline')),
    };
    const { result } = renderHook(() => useCoverage('mammography', warsaw, api));
    await waitFor(() => expect(api.getCoverage).toHaveBeenCalled());
    expect(result.current).toBeNull();

    const other = renderHook(() => useCoverage('dental_checkup', warsaw, api));
    expect(other.result.current).toBeNull();
    expect(api.getCoverage).toHaveBeenCalledTimes(1);
  });
});
