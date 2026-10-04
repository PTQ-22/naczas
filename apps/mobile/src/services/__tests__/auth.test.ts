import { AuthError, authenticate } from '../auth';

const respond = (status: number, body: unknown) =>
  jest.fn<Promise<Response>, [string, RequestInit?]>(() =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response),
  );

describe.skip('authenticate', () => {
  it('returns the family code and trims the email', async () => {
    const fetchFn = respond(200, { user: { id: 'u', email: 'a@b.pl', familyCode: 'ABC' } });
    await expect(
      authenticate('login', ' a@b.pl ', 'secret1', fetchFn as unknown as typeof fetch),
    ).resolves.toEqual({
      familyCode: 'ABC',
      email: 'a@b.pl',
    });
    const init = fetchFn.mock.calls[0]?.[1];
    expect(JSON.parse(init?.body as string)).toEqual({ email: 'a@b.pl', password: 'secret1' });
  });

  it.each([
    [401, { error: { code: 'unauthorized', message: 'x' } }, 'invalid'],
    [400, { error: { code: 'already_exists', message: 'x' } }, 'exists'],
    [400, { error: { code: 'validation_error', message: 'x' } }, 'validation'],
    [500, { error: { code: 'internal', message: 'x' } }, 'unknown'],
  ] as const)('HTTP %s → %s error', async (status, body, kind) => {
    await expect(
      authenticate('login', 'a@b.pl', 'x', respond(status, body) as unknown as typeof fetch),
    ).rejects.toMatchObject({
      kind,
    });
  });

  it('network failure is its own kind (shown as "brak połączenia")', async () => {
    const fetchFn = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const error = await authenticate('login', 'a@b.pl', 'x', fetchFn).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ kind: 'network' });
  });
});
