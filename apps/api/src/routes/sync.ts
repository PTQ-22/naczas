import { zValidator } from '@hono/zod-validator';
import { eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { ProfileSchema, ExamRecordSchema } from '@naczas/shared';

import { db } from '../db';
import { errorResponse } from './common';
import { bets, profiles, records } from '../db/schema';

export function syncRoutes() {
  return new Hono()
    .post(
      '/sync/push',
      zValidator(
        'json',
        z.object({
          familyCode: z.string().min(1),
          profiles: z.array(ProfileSchema),
          records: z.array(ExamRecordSchema),
          bets: z.array(
            z.object({
              id: z.string(),
              profileId: z.string(),
              amountPln: z.number(),
              createdAt: z.string(),
              expiresAt: z.string(),
              status: z.string(),
              examIds: z.array(z.string()),
            }),
          ),
        }),
        (result, c) => {
          if (!result.success) return errorResponse(c, 400, 'validation_error', 'Invalid payload');
        },
      ),
      async (c) => {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        // 1. Upsert profiles
        if (data.profiles.length > 0) {
          await db
            .insert(profiles)
            .values(
              data.profiles.map((p) => ({
                id: p.id,
                familyCode: data.familyCode,
                payload: JSON.stringify(p),
              })),
            )
            .onConflictDoUpdate({
              target: profiles.id,
              set: {
                payload: sql`EXCLUDED.payload`,
              },
            });
        }

        // 2. Upsert records
        if (data.records.length > 0) {
          await db
            .insert(records)
            .values(
              data.records.map((r) => ({
                ...r,
                id: `${r.profileId}|${r.examId}`,
              })),
            )
            .onConflictDoUpdate({
              target: records.id,
              set: {
                status: sql`EXCLUDED.status`,
                lastDone: sql`EXCLUDED.last_done`,
                bookedFor: sql`EXCLUDED.booked_for`,
                bookedTime: sql`EXCLUDED.booked_time`,
                updatedAt: sql`EXCLUDED.updated_at`,
              },
            });
        }

        // 3. Upsert bets
        if (data.bets.length > 0) {
          await db
            .insert(bets)
            .values(
              data.bets.map((b) => ({
                ...b,
                examIds: JSON.stringify(b.examIds),
              })),
            )
            .onConflictDoUpdate({
              target: bets.id,
              set: {
                status: sql`EXCLUDED.status`,
                amountPln: sql`EXCLUDED.amount_pln`,
                examIds: sql`EXCLUDED.exam_ids`,
              },
            });
        }

        return c.json({ success: true, timestamp: now });
      },
    )
    .get('/sync/pull/:familyCode', async (c) => {
      const familyCode = c.req.param('familyCode');

      const familyProfiles = await db
        .select()
        .from(profiles)
        .where(eq(profiles.familyCode, familyCode));
      const profileIds = familyProfiles.map((p) => p.id);

      if (profileIds.length === 0) {
        return c.json({ profiles: [], records: [], bets: [] });
      }

      const familyRecords = await db
        .select()
        .from(records)
        .where(inArray(records.profileId, profileIds));
      const familyBets = await db.select().from(bets).where(inArray(bets.profileId, profileIds));

      return c.json({
        profiles: familyProfiles.map(
          (p) => JSON.parse(p.payload) as import('@naczas/shared').Profile,
        ),
        records: familyRecords.map((r) => {
          const { id: _, ...rest } = r;
          return rest;
        }),
        bets: familyBets.map((b) => ({
          ...b,
          examIds: JSON.parse(b.examIds) as string[],
        })),
      });
    });
}
