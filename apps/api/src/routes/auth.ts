import { zValidator } from '@hono/zod-validator';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { db } from '../db';
import { errorResponse, validationMessage } from './common';
import { users } from '../db/schema';

// Phone keyboards capitalise the first letter; "Ala@x.pl" and "ala@x.pl" are one account.
const EmailSchema = z.string().trim().toLowerCase().pipe(z.email());

export function authRoutes() {
  return new Hono()
    .post(
      '/auth/register',
      zValidator(
        'json',
        z.object({
          email: EmailSchema,
          password: z.string().min(6),
        }),
        (result, c) => {
          if (!result.success) {
            return errorResponse(c, 400, 'validation_error', validationMessage(result.error));
          }
        },
      ),
      async (c) => {
        const { email, password } = c.req.valid('json');
        const now = new Date().toISOString();

        // Very basic hackathon-level auth
        const existing = await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);
        if (existing.length > 0) {
          return errorResponse(c, 400, 'already_exists', 'User already exists');
        }

        const id = crypto.randomUUID();
        // Generate a random 6-character uppercase alphanumeric code for family sharing
        const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        await db.insert(users).values({
          id,
          email,
          passwordHash: password, // Not hashing for speed in hackathon, only demo
          familyCode,
          createdAt: now,
        });

        return c.json({ user: { id, email, familyCode } });
      },
    )
    .post(
      '/auth/login',
      zValidator(
        'json',
        z.object({
          email: EmailSchema,
          password: z.string(),
        }),
        (result, c) => {
          if (!result.success) {
            return errorResponse(c, 400, 'validation_error', validationMessage(result.error));
          }
        },
      ),
      async (c) => {
        const { email, password } = c.req.valid('json');

        const existing = await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);
        const user = existing[0];
        if (!user || user.passwordHash !== password) {
          return errorResponse(c, 401, 'unauthorized', 'Invalid credentials');
        }

        return c.json({ user: { id: user.id, email: user.email, familyCode: user.familyCode } });
      },
    );
}
