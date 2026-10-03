import { describe, expect, it } from 'vitest';

import { app } from '../src/app';

describe('GET /v1/health', () => {
  it('returns ok', async () => {
    const res = await app.request('/v1/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });
});
