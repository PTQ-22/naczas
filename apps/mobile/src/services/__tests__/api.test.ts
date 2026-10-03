import { ApiRequestError, buildQuery, createHttpApi, isOfflineError, roundCoord } from '../api';

const summary = {
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

function respond(status: number, body: unknown): typeof fetch {
  return jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as unknown as Response),
  );
}

async function errorOf(promise: Promise<unknown>): Promise<ApiRequestError> {
  try {
    await promise;
  } catch (err) {
    if (err instanceof ApiRequestError) return err;
    throw err;
  }
  throw new Error('expected rejection');
}

const params = { examId: 'colonoscopy_screening', province: '07' } as const;

describe('buildQuery', () => {
  it('rounds coordinates to 2 decimals before they leave the device', () => {
    const query = new URLSearchParams(buildQuery({ ...params, lat: 52.229676, lng: 21.012229 }));
    expect(query.get('lat')).toBe('52.23');
    expect(query.get('lng')).toBe('21.01');
  });

  it('omits location when either coordinate is missing', () => {
    expect(buildQuery({ ...params, lat: 52.2 })).toBe('examId=colonoscopy_screening&province=07');
  });

  it('includes sort and limit for facilities', () => {
    expect(buildQuery({ ...params, sort: 'soonest', limit: 5 })).toContain('sort=soonest&limit=5');
  });

  it('rounds half away from zero like the server', () => {
    expect(roundCoord(50.065)).toBeCloseTo(50.07, 2);
  });
});

describe('createHttpApi', () => {
  it('returns parsed wait times', async () => {
    const fetchImpl = respond(200, summary);
    await expect(createHttpApi(fetchImpl).getWaitTimes(params)).resolves.toEqual(summary);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/v1/wait-times?examId=colonoscopy_screening&province=07'),
      expect.anything(),
    );
  });

  it('maps an API error body to code + status', async () => {
    const error = await errorOf(
      createHttpApi(
        respond(400, { error: { code: 'unknown_exam', message: 'nope' } }),
      ).getWaitTimes(params),
    );
    expect(error).toMatchObject({ kind: 'http', status: 400, code: 'unknown_exam' });
    expect(isOfflineError(error)).toBe(false);
  });

  it('treats 503 data_unavailable as offline', async () => {
    const error = await errorOf(
      createHttpApi(
        respond(503, { error: { code: 'data_unavailable', message: 'down' } }),
      ).getWaitTimes(params),
    );
    expect(error.code).toBe('data_unavailable');
    expect(isOfflineError(error)).toBe(true);
  });

  it('rejects a response that does not match the contract', async () => {
    const error = await errorOf(
      createHttpApi(respond(200, { ...summary, p75Days: 'soon' })).getWaitTimes(params),
    );
    expect(error.kind).toBe('invalid_response');
  });

  it('reports network failures as offline', async () => {
    const error = await errorOf(
      createHttpApi(() => Promise.reject(new TypeError('Network request failed'))).getWaitTimes(
        params,
      ),
    );
    expect(error.kind).toBe('network');
    expect(isOfflineError(error)).toBe(true);
  });

  it('times out a hanging request', async () => {
    const hanging: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const error = await errorOf(createHttpApi(hanging).getWaitTimes(params, { timeoutMs: 10 }));
    expect(error.kind).toBe('timeout');
    expect(isOfflineError(error)).toBe(true);
  });
});
