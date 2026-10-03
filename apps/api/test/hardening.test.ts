import { describe, expect, it } from 'vitest';

import { ApiErrorSchema } from '@naczas/shared';

import { createApp, type AppDeps } from '../src/app';
import { loadEnv } from '../src/env';
import { fixtureFetch, loadAllFixtures } from './helpers/nfz-fixtures';
import { createNfzClient } from '../src/nfz/client';
import { createSnapshotStore } from '../src/nfz/snapshot';

function makeApp(overrides: Partial<AppDeps> = {}) {
  return createApp({
    nfz: createNfzClient({
      fetch: fixtureFetch(loadAllFixtures()).fetch,
      minIntervalMs: 0,
      sleep: () => Promise.resolve(),
    }),
    snapshot: createSnapshotStore('/nonexistent'),
    ...overrides,
  });
}

describe('env', () => {
  it('applies defaults', () => {
    expect(loadEnv({})).toEqual({
      NODE_ENV: 'development',
      PORT: 8787,
      CORS_ORIGINS: [],
      REFRESH_ON_START: true,
      RATE_LIMIT_PER_MIN: 60,
      TRUST_PROXY: false,
    });
  });

  it('parses a production config', () => {
    expect(
      loadEnv({
        NODE_ENV: 'production',
        PORT: '10000',
        CORS_ORIGINS: 'https://naczas.vercel.app, https://naczas.pl',
        REFRESH_ON_START: 'false',
        TRUST_PROXY: 'true',
      }),
    ).toMatchObject({
      PORT: 10000,
      CORS_ORIGINS: ['https://naczas.vercel.app', 'https://naczas.pl'],
      REFRESH_ON_START: false,
      TRUST_PROXY: true,
    });
  });

  it('rejects invalid values with a readable message', () => {
    expect(() => loadEnv({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadEnv({ REFRESH_ON_START: 'yes' })).toThrow(/REFRESH_ON_START/);
  });
});

describe('CORS', () => {
  const preflight = (app: ReturnType<typeof makeApp>, origin: string) =>
    app.request('/v1/health', { headers: { Origin: origin } });

  it('allows configured origins only', async () => {
    const app = makeApp({
      cors: { origins: ['https://naczas.vercel.app'], allowLocalhost: false },
    });
    const ok = await preflight(app, 'https://naczas.vercel.app');
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://naczas.vercel.app');
    const denied = await preflight(app, 'https://evil.example');
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    const local = await preflight(app, 'http://localhost:8081');
    expect(local.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('allows any localhost port in development', async () => {
    const app = makeApp({ cors: { origins: [], allowLocalhost: true } });
    for (const origin of ['http://localhost:8081', 'http://127.0.0.1:19006']) {
      const res = await preflight(app, origin);
      expect(res.headers.get('access-control-allow-origin')).toBe(origin);
    }
  });
});

describe('rate limit', () => {
  const url = '/v1/wait-times?examId=colonoscopy_screening&province=07';
  const from = (ip: string) => ({ headers: { 'X-Forwarded-For': `${ip}, 10.0.0.1` } });

  it('returns 429 with Retry-After after N requests per minute per IP', async () => {
    let time = Date.parse('2026-10-04T10:00:00Z');
    const app = makeApp({
      now: () => new Date(time),
      rateLimit: { perMinute: 3, trustProxy: true },
    });

    for (let i = 0; i < 3; i++) expect((await app.request(url, from('1.1.1.1'))).status).toBe(200);
    const limited = await app.request(url, from('1.1.1.1'));
    expect(limited.status).toBe(429);
    expect(ApiErrorSchema.parse(await limited.json()).error.code).toBe('rate_limited');
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);

    // other client unaffected
    expect((await app.request(url, from('2.2.2.2'))).status).toBe(200);
    // health checks are never limited
    expect((await app.request('/v1/health', from('1.1.1.1'))).status).toBe(200);

    time += 60_000; // next window
    expect((await app.request(url, from('1.1.1.1'))).status).toBe(200);
  });

  it('ignores X-Forwarded-For unless behind a trusted proxy (no spoofing past the limit)', async () => {
    const app = makeApp({ rateLimit: { perMinute: 2, trustProxy: false } });
    expect((await app.request(url, from('1.1.1.1'))).status).toBe(200);
    expect((await app.request(url, from('2.2.2.2'))).status).toBe(200);
    expect((await app.request(url, from('3.3.3.3'))).status).toBe(429);
  });
});

describe('request log', () => {
  it('logs method, path, status and time — never the query string (coordinates)', async () => {
    const lines: string[] = [];
    const app = makeApp({ log: (line) => lines.push(line) });
    await app.request(
      '/v1/wait-times?examId=colonoscopy_screening&province=07&lat=52.23&lng=21.01',
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^GET \/v1\/wait-times 200 \d+ms$/);
    expect(lines.join('\n')).not.toMatch(/52\.23|21\.01|lat=|lng=/);
  });
});
