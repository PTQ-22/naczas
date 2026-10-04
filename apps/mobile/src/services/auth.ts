import { z } from 'zod';

import { API_BASE_URL } from './api';
import { isSyncEnabled } from './feature-flags';

/** The free API host sleeps when idle — the first request can take ~50 s. */
const AUTH_TIMEOUT_MS = 70_000;

export type AuthErrorKind = 'invalid' | 'exists' | 'validation' | 'network' | 'unknown';

export class AuthError extends Error {
  override name = 'AuthError';
  constructor(
    readonly kind: AuthErrorKind,
    message: string,
  ) {
    super(message);
  }
}

const AuthResponseSchema = z.object({
  user: z.object({ id: z.string(), email: z.string(), familyCode: z.string().min(1) }),
});
const ErrorBodySchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

/** POST /v1/auth/{login|register} → the account's family code. Errors are typed for the UI. */
export async function authenticate(
  mode: 'login' | 'register',
  email: string,
  password: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ familyCode: string; email: string }> {
  if (!isSyncEnabled()) throw new AuthError('unknown', 'Sync disabled');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetchFn(`${API_BASE_URL}/v1/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: controller.signal,
    });
  } catch {
    throw new AuthError('network', 'Network error');
  } finally {
    clearTimeout(timer);
  }
  const body: unknown = await res.json().catch(() => undefined);
  if (res.ok) {
    const parsed = AuthResponseSchema.safeParse(body);
    if (!parsed.success) throw new AuthError('unknown', 'Unexpected auth response');
    return { familyCode: parsed.data.user.familyCode, email: parsed.data.user.email };
  }
  const code = ErrorBodySchema.safeParse(body).data?.error.code;
  if (res.status === 401) throw new AuthError('invalid', 'Invalid credentials');
  if (code === 'already_exists') throw new AuthError('exists', 'Account exists');
  if (res.status === 400) throw new AuthError('validation', 'Validation error');
  throw new AuthError('unknown', `HTTP ${res.status}`);
}
