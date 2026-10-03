import { ApiRequestError } from '../api';
import { createMockApi } from '../api.mock';

const api = createMockApi({ delayMs: 0 });
const warsaw = { lat: 52.23, lng: 21.01 };

describe('mock API', () => {
  it('serves recorded wait times for a fixture province', async () => {
    const summary = await api.getWaitTimes({ examId: 'colonoscopy_screening', province: '06' });
    expect(summary).toMatchObject({ examId: 'colonoscopy_screening', province: '06' });
    expect(summary.p75Days).toEqual(expect.any(Number));
  });

  it('relabels fallback data for provinces without fixtures', async () => {
    const summary = await api.getWaitTimes({ examId: 'dental_checkup', province: '12' });
    expect(summary.province).toBe('12');
  });

  it('rejects exams without NFZ queues, like the API', async () => {
    await expect(api.getWaitTimes({ examId: 'mammography', province: '07' })).rejects.toMatchObject(
      { status: 400, code: 'unknown_exam' },
    );
  });

  it('sorts facilities by distance and applies the limit', async () => {
    const res = await api.getFacilities({
      examId: 'eye_exam',
      province: '07',
      ...warsaw,
      sort: 'nearest',
      limit: 3,
    });
    expect(res.items).toHaveLength(3);
    const distances = res.items.map((f) => f.distanceKm);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it('has no distances and no nearest sort without a location', async () => {
    const res = await api.getFacilities({ examId: 'eye_exam', province: '07' });
    expect(res.items.every((f) => f.distanceKm === 0)).toBe(true);
    await expect(
      api.getFacilities({ examId: 'eye_exam', province: '07', sort: 'nearest' }),
    ).rejects.toBeInstanceOf(ApiRequestError);
  });
});
