import { getConnInfo } from '@hono/node-server/conninfo';

import { errorResponse } from '../routes/common';

import type { Context, MiddlewareHandler } from 'hono';

export interface RateLimitOptions {
  perMinute: number;
  /** Use the first X-Forwarded-For entry (set by the hosting proxy) as the client IP. */
  trustProxy: boolean;
}

const WINDOW_MS = 60_000;

function clientIp(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown'; // no Node socket (e.g. app.request in tests)
  }
}

/**
 * In-memory fixed-window limiter per client IP. Enough for one small instance; the IP is only
 * a map key and is never logged.
 */
export function rateLimit(
  { perMinute, trustProxy }: RateLimitOptions,
  now: () => number,
): MiddlewareHandler {
  const windows = new Map<string, { start: number; count: number }>();

  return async (c, next) => {
    const t = now();
    if (windows.size > 10_000) {
      for (const [ip, w] of windows) if (t - w.start >= WINDOW_MS) windows.delete(ip);
    }
    const ip = clientIp(c, trustProxy);
    let w = windows.get(ip);
    if (!w || t - w.start >= WINDOW_MS) {
      w = { start: t, count: 0 };
      windows.set(ip, w);
    }
    w.count += 1;
    if (w.count > perMinute) {
      c.header('Retry-After', String(Math.ceil((w.start + WINDOW_MS - t) / 1000)));
      return errorResponse(c, 429, 'rate_limited', 'Too many requests, try again in a minute');
    }
    await next();
  };
}
