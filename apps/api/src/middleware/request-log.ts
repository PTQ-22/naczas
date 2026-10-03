import type { MiddlewareHandler } from 'hono';

/**
 * One line per request: method, path, status, duration. Deliberately no query string and no IP —
 * the query carries the user's coordinates (AGENTS.md §8).
 */
export function requestLog(log: (line: string) => void): MiddlewareHandler {
  return async (c, next) => {
    const started = performance.now();
    await next();
    log(
      `${c.req.method} ${c.req.path} ${c.res.status} ${Math.round(performance.now() - started)}ms`,
    );
  };
}
