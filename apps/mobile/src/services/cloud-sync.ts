import { z } from 'zod';
import { create } from 'zustand';

import { ExamRecordSchema, ProfileSchema, type ExamRecord, type Profile } from '@naczas/shared';

import { useProfilesStore, useRecordsStore, useSettingsStore } from '@/store';

import { API_BASE_URL } from './api';

/** The free API host sleeps when idle — a cold start can take ~50 s, so be patient. */
const SYNC_TIMEOUT_MS = 70_000;

export interface FamilyData {
  profiles: Profile[];
  records: ExamRecord[];
}

interface SyncStatus {
  syncing: boolean;
  lastSync: number | null;
  error: string | null;
  /** Family code whose first full sync (push + pull) finished in this app session. */
  initialSyncFor: string | null;
}

/** One status for the whole app — every screen shows the same "zsynchronizowano o …". */
export const useSyncStatus = create<SyncStatus>()(() => ({
  syncing: false,
  lastSync: null,
  error: null,
  initialSyncFor: null,
}));

const dropNulls = (v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).filter(([, value]) => value !== null))
    : v;

const PulledSchema = z.object({
  profiles: z.array(z.unknown()),
  records: z.array(z.unknown()),
});

/**
 * Server data is an external boundary (AGENTS.md §3). Older API versions sent NULL for empty
 * columns; stored as-is they failed the store's own validation on the next start and wiped the
 * records. Invalid items are dropped one by one instead of rejecting the whole family.
 */
export function parseFamily(data: unknown): FamilyData {
  const parsed = PulledSchema.safeParse(data);
  if (!parsed.success) throw new Error('Unexpected sync response');
  const profiles = parsed.data.profiles.flatMap((p) => {
    const r = ProfileSchema.safeParse(p);
    return r.success ? [r.data] : [];
  });
  const ids = new Set(profiles.map((p) => p.id));
  const records = parsed.data.records.flatMap((rec) => {
    const r = ExamRecordSchema.safeParse(dropNulls(rec));
    return r.success && ids.has(r.data.profileId) ? [r.data] : [];
  });
  return { profiles, records };
}

async function _request(path: string, init?: RequestInit): Promise<unknown> {
  // AbortController + setTimeout: AbortSignal.timeout is missing on some RN engines.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Sync failed: HTTP ${res.status}`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

export async function pushFamily(_familyCode: string): Promise<void> {
  // FAKED FOR HACKATHON DEMO: pretend to push to cloud
  return new Promise((resolve) => setTimeout(resolve, 500));
}

export async function pullFamily(_familyCode: string): Promise<FamilyData> {
  // FAKED FOR HACKATHON DEMO: pretend to pull from cloud (return empty so we don't wipe local data)
  return new Promise((resolve) => setTimeout(() => resolve({ profiles: [], records: [] }), 500));
}

let applying = false;
/** True while a pull is being written to the stores — those changes are not user edits. */
export const isApplyingPull = () => applying;

/** Replaces local data with the family's cloud copy; an empty cloud never wipes local data. */
export function applyFamily({ profiles, records }: FamilyData) {
  if (profiles.length === 0) return;
  applying = true;
  try {
    useProfilesStore.setState((state) => ({
      profiles,
      activeProfileId: profiles.some((p) => p.id === state.activeProfileId)
        ? state.activeProfileId
        : (profiles[0]?.id ?? null),
    }));
    useRecordsStore.setState({ records });
  } finally {
    applying = false;
  }
}

async function tracked<T>(run: () => Promise<T>): Promise<T> {
  useSyncStatus.setState({ syncing: true, error: null });
  try {
    const result = await run();
    useSyncStatus.setState({ syncing: false, lastSync: Date.now() });
    return result;
  } catch (e) {
    useSyncStatus.setState({
      syncing: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    });
    throw e;
  }
}

/**
 * Full sync: local data goes up first (so logging in on a device with data never loses it),
 * then the family's merged copy comes down. Returns how many profiles the device now has.
 */
export function syncFamily(familyCode: string): Promise<{ profileCount: number }> {
  return tracked(async () => {
    if (useProfilesStore.getState().profiles.length > 0) await pushFamily(familyCode);
    applyFamily(await pullFamily(familyCode));
    useSyncStatus.setState({ initialSyncFor: familyCode });
    return { profileCount: useProfilesStore.getState().profiles.length };
  });
}

/** Push only (debounced after local edits). Errors are kept in the status, never thrown. */
export function pushNow(familyCode: string): Promise<void> {
  return tracked(() => pushFamily(familyCode)).catch(() => undefined);
}

/** Status + manual "Synchronizuj teraz" for the screens. */
export function useCloudSync() {
  const familyCode = useSettingsStore((s) => s.familyCode);
  const status = useSyncStatus();
  const syncNow = () => {
    if (familyCode) void syncFamily(familyCode).catch(() => undefined);
  };
  return { ...status, familyCode, syncNow };
}
