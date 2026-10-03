import { z } from 'zod';

const bool = (name: string) =>
  z
    .enum(['true', 'false'], { message: `${name} must be "true" or "false"` })
    .transform((v) => v === 'true');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  /** Comma-separated web origins allowed by CORS, e.g. the Vercel URL */
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  REFRESH_ON_START: bool('REFRESH_ON_START').default(true),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(60),
  /** Only behind a reverse proxy (Render, Railway): trust its X-Forwarded-For for client IPs */
  TRUST_PROXY: bool('TRUST_PROXY').default(false),
});
export type Env = z.infer<typeof EnvSchema>;

/** Validates env at startup — a misconfigured deploy should fail loudly, not half-work. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment:\n${issues.join('\n')}`);
  }
  return parsed.data;
}
