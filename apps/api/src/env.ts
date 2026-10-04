import { z } from 'zod';

import { NFZ_API_VERSION, NFZ_DEFAULT_BASE_URL } from './nfz/client';

const bool = (name: string) =>
  z
    .enum(['true', 'false'], { message: `${name} must be "true" or "false"` })
    .transform((v) => v === 'true');

/** `KEY=` in .env means "not set" */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const EnvSchema = z
  .object({
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
    /** "Zadzwoń za mnie" demo — without the first three the endpoint runs a scripted simulation */
    VAPI_API_KEY: optional(z.string()),
    VAPI_PHONE_NUMBER_ID: optional(z.string()),
    /** The ONLY number the agent ever dials (a team member's phone), never a clinic */
    DEMO_CALL_TO: optional(
      z.string().regex(/^\+48\d{9}$/, 'DEMO_CALL_TO must look like +48XXXXXXXXX'),
    ),
    /**
     * Who answers the demo call. 'phone' (default) dials DEMO_CALL_TO — a team member's phone.
     * 'agent' dials DEMO_RECEPTIONIST_TO instead: a second Vapi assistant playing the clinic's
     * reception (docs/call-assist-receptionist.md), so a public demo never rings a person.
     */
    CALL_TARGET: z.enum(['phone', 'agent']).default('phone'),
    /** Vapi number answered by the receptionist assistant; any E.164 (free Vapi numbers are +1) */
    DEMO_RECEPTIONIST_TO: optional(
      z.string().regex(/^\+\d{8,15}$/, 'DEMO_RECEPTIONIST_TO must be E.164, e.g. +1…'),
    ),
    /** Live calls started per day (server time); beyond it new calls run the simulation */
    CALL_ASSIST_DAILY_LIMIT: z.coerce.number().int().min(0).default(20),
    /** ElevenLabs voice id; default is Azure's native Polish voice */
    VAPI_VOICE_ID: optional(z.string()),
    /** Public https URL of this API — enables the live-transcript webhook */
    PUBLIC_URL: optional(z.url()),
    VAPI_WEBHOOK_SECRET: optional(z.string()),
    /**
     * Alternative to VAPI_PHONE_NUMBER_ID: Twilio places the call from a verified caller ID (no
     * purchased number) and bridges it to Vapi over SIP.
     */
    TWILIO_ACCOUNT_SID: optional(z.string()),
    TWILIO_AUTH_TOKEN: optional(z.string()),
    /** Verified caller ID in Twilio — shown to the callee; must differ from DEMO_CALL_TO */
    TWILIO_FROM: optional(z.string().regex(/^\+\d{8,15}$/, 'TWILIO_FROM must be E.164, e.g. +48…')),
    /** Free Vapi SIP URI, e.g. sip:naczas-demo-<something-unique>@sip.vapi.ai */
    VAPI_SIP_URI: optional(
      z
        .string()
        .regex(
          /^sip:[^@\s]+@sip(\.eu)?\.vapi\.ai$/,
          'VAPI_SIP_URI must look like sip:name@sip.vapi.ai',
        ),
    ),
    /** NFZ ITL API root and its api-version — change together (v1.4 rejects api-version=1.3) */
    NFZ_BASE_URL: z.url().default(NFZ_DEFAULT_BASE_URL),
    NFZ_API_VERSION: z
      .string()
      .regex(/^\d+\.\d+$/)
      .default(NFZ_API_VERSION),
  })
  // An explicit 'agent' target without a number must not silently fall back to dialling a person.
  // Without Vapi keys nothing is dialled (simulation), so the number isn't needed then.
  .refine((e) => e.CALL_TARGET !== 'agent' || !e.VAPI_API_KEY || e.DEMO_RECEPTIONIST_TO, {
    path: ['DEMO_RECEPTIONIST_TO'],
    message: 'CALL_TARGET=agent requires DEMO_RECEPTIONIST_TO',
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
