import { eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { ExamRecordSchema, ProfileSchema } from '@naczas/shared';

import { db } from '../db';
import { errorResponse, validationMessage } from './common';
import { familyFromRows, profileRows, recordRows } from './sync-mapping';
import { profiles, records } from '../db/schema';

// Older app versions stored NULLs pulled from the DB and send them back; accept them as "absent"
// instead of rejecting the whole push (which silently stopped every later save).
const NullableRecordSchema = z.preprocess(
  (v) =>
    v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).filter(([, value]) => value !== null))
      : v,
  ExamRecordSchema,
);

export const PushSchema = z.object({
  familyCode: z.string().min(1),
  profiles: z.array(ProfileSchema),
  records: z.array(NullableRecordSchema),
});

export function syncRoutes() {
  return new Hono()
    .post('/sync/push', async (c) => {
      const parsed = PushSchema.safeParse(await c.req.json().catch(() => undefined));
      if (!parsed.success) {
        return errorResponse(c, 400, 'validation_error', validationMessage(parsed.error));
      }
      const { familyCode, profiles: inProfiles, records: inRecords } = parsed.data;
      const now = new Date().toISOString();

      // Records reference profile rows — upsert the profiles first.
      const pRows = profileRows(familyCode, inProfiles);
      if (pRows.length > 0) {
        await db
          .insert(profiles)
          .values(pRows)
          .onConflictDoUpdate({ target: profiles.id, set: { payload: sql`EXCLUDED.payload` } });
      }

      // Only records of profiles in this push: a record for a profile the server doesn't have
      // would violate the foreign key and fail the whole batch.
      const known = new Set(inProfiles.map((p) => p.id));
      const rRows = recordRows(
        familyCode,
        inRecords.filter((r) => known.has(r.profileId)),
      );
      if (rRows.length > 0) {
        await db
          .insert(records)
          .values(rRows)
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

      return c.json({ success: true, timestamp: now });
    })
    .get('/sync/pull/:familyCode', async (c) => {
      const familyCode = c.req.param('familyCode');
      const familyProfiles = await db
        .select()
        .from(profiles)
        .where(eq(profiles.familyCode, familyCode));
      const rowIds = familyProfiles.map((p) => p.id);
      const familyRecords =
        rowIds.length > 0
          ? await db.select().from(records).where(inArray(records.profileId, rowIds))
          : [];
      return c.json(familyFromRows(familyProfiles, familyRecords));
    });
}
