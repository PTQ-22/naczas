import { ExamRecordSchema, ProfileSchema, type ExamRecord, type Profile } from '@naczas/shared';

/**
 * Pure mapping between the family payload and the DB rows (no DB access — unit-tested).
 *
 * Row ids are scoped by family: client profile ids are not globally unique (every "demo" load
 * creates `demo-mama`), and an upsert on the bare id would move one family's profile into
 * another's. Rows written before this change used the bare id; reads accept both.
 */
export const profileRowId = (familyCode: string, profileId: string) => `${familyCode}:${profileId}`;
export const recordRowId = (familyCode: string, profileId: string, examId: string) =>
  `${profileRowId(familyCode, profileId)}|${examId}`;

export interface ProfileRow {
  id: string;
  familyCode: string;
  payload: string;
}

export interface RecordRow {
  id: string;
  profileId: string;
  examId: string;
  status: string;
  lastDone: string | null;
  bookedFor: string | null;
  bookedTime: string | null;
  updatedAt: string;
}

export function profileRows(familyCode: string, profiles: readonly Profile[]): ProfileRow[] {
  return profiles.map((p) => ({
    id: profileRowId(familyCode, p.id),
    familyCode,
    payload: JSON.stringify(p),
  }));
}

export function recordRows(familyCode: string, records: readonly ExamRecord[]): RecordRow[] {
  return records.map((r) => ({
    id: recordRowId(familyCode, r.profileId, r.examId),
    profileId: profileRowId(familyCode, r.profileId),
    examId: r.examId,
    status: r.status,
    lastDone: r.lastDone ?? null,
    bookedFor: r.bookedFor ?? null,
    bookedTime: r.bookedTime ?? null,
    updatedAt: r.updatedAt,
  }));
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * DB rows → the family payload the app stores. Empty columns are NULL in Postgres but absent
 * fields in the domain model: sending `null` back made every later push fail validation (400).
 * Anything that still doesn't parse is dropped rather than poisoning the client's store.
 */
export function familyFromRows(
  profilesIn: readonly ProfileRow[],
  recordsIn: readonly RecordRow[],
): { profiles: Profile[]; records: ExamRecord[] } {
  const byRowId = new Map<string, Profile>();
  for (const row of profilesIn) {
    const parsed = ProfileSchema.safeParse(parseJson(row.payload));
    if (parsed.success) byRowId.set(row.id, parsed.data);
  }
  // A family may have both a legacy (bare id) and a scoped row for the same profile — keep one,
  // preferring the scoped row since that is what current clients write.
  const profiles = new Map<string, { profile: Profile; scoped: boolean }>();
  for (const [rowId, profile] of byRowId) {
    const scoped = rowId.includes(':');
    const seen = profiles.get(profile.id);
    if (!seen || (scoped && !seen.scoped)) profiles.set(profile.id, { profile, scoped });
  }

  const records = new Map<string, ExamRecord>();
  for (const row of recordsIn) {
    const profile = byRowId.get(row.profileId);
    if (!profile) continue;
    const parsed = ExamRecordSchema.safeParse({
      profileId: profile.id,
      examId: row.examId,
      status: row.status,
      updatedAt: row.updatedAt,
      ...(row.lastDone !== null && { lastDone: row.lastDone }),
      ...(row.bookedFor !== null && { bookedFor: row.bookedFor }),
      ...(row.bookedTime !== null && { bookedTime: row.bookedTime }),
    });
    if (!parsed.success) continue;
    const key = `${profile.id}|${row.examId}`;
    const seen = records.get(key);
    if (!seen || parsed.data.updatedAt >= seen.updatedAt) records.set(key, parsed.data);
  }

  return {
    profiles: [...profiles.values()].map((p) => p.profile),
    records: [...records.values()],
  };
}
