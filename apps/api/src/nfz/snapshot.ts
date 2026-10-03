import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { type NfzQueue, NfzQueueSchema } from './schemas';
import { benefitSlug } from './slug';

/**
 * Offline fallback: data/snapshot/<province>/<benefit-slug>.jsonl
 * Line 1 = header, then one slim NFZ queue record per line. JSON Lines instead of pretty JSON
 * keeps 16 provinces × benefits small, diff-friendly and out of Prettier's way (lint-staged).
 */
const HeaderSchema = z.object({
  benefit: z.string(),
  province: z.string(),
  case: z.number(),
  fetchedAt: z.string(), // ISO timestamp
  count: z.number(),
});
export type SnapshotHeader = z.infer<typeof HeaderSchema>;

export interface SnapshotEntry {
  benefit: string;
  province: string;
  queues: NfzQueue[];
  fetchedAt: string;
}

export interface SnapshotStore {
  read(province: string, benefit: string): Promise<SnapshotEntry | null>;
  /** Every entry in the snapshot (used to warm the cache on startup). */
  readAll(): Promise<SnapshotEntry[]>;
  /** 'YYYY-MM-DD' of the newest recording, null when the snapshot is empty */
  latestFetchedAt(): Promise<string | null>;
}

export const snapshotFile = (dir: string, province: string, benefit: string) =>
  path.join(dir, province, `${benefitSlug(benefit)}.jsonl`);

/** Keeps only the fields normalization and aggregation read — raw NFZ records are ~4× bigger. */
export function slimQueue(queue: NfzQueue): NfzQueue {
  const a = queue.attributes;
  const stats = a.statistics?.['provider-data'];
  return {
    id: queue.id,
    attributes: {
      benefit: a.benefit,
      provider: a.provider ?? null,
      place: a.place ?? null,
      address: a.address ?? null,
      locality: a.locality ?? null,
      phone: a.phone ?? null,
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
      toilet: a.toilet ?? null,
      ramp: a.ramp ?? null,
      'car-park': a['car-park'] ?? null,
      elevator: a.elevator ?? null,
      statistics: stats
        ? {
            'provider-data': {
              awaiting: stats.awaiting ?? null,
              'average-period': stats['average-period'] ?? null,
              update: stats.update ?? null,
            },
          }
        : null,
    },
  };
}

export async function writeSnapshot(
  dir: string,
  header: Omit<SnapshotHeader, 'count'>,
  queues: NfzQueue[],
): Promise<string> {
  const file = snapshotFile(dir, header.province, header.benefit);
  await mkdir(path.dirname(file), { recursive: true });
  const lines = [{ ...header, count: queues.length }, ...queues.map(slimQueue)];
  // Write-then-rename so an interrupted run never leaves a truncated file behind.
  await writeFile(`${file}.tmp`, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  await rename(`${file}.tmp`, file);
  return file;
}

function parseSnapshot(text: string): SnapshotEntry | null {
  const [first, ...rest] = text.split('\n').filter((l) => l.trim() !== '');
  if (!first) return null;
  const header = HeaderSchema.safeParse(JSON.parse(first));
  if (!header.success) return null;
  const queues = rest.map((l) => NfzQueueSchema.parse(JSON.parse(l)));
  if (queues.length !== header.data.count) return null; // truncated or hand-edited
  const { benefit, province, fetchedAt } = header.data;
  return { benefit, province, fetchedAt, queues };
}

export function createSnapshotStore(dir: string): SnapshotStore {
  let latest: Promise<string | null> | undefined;

  async function readFileEntry(file: string): Promise<SnapshotEntry | null> {
    try {
      return parseSnapshot(await readFile(file, 'utf8'));
    } catch {
      return null; // missing or unreadable file = no snapshot for this key
    }
  }

  async function listFiles(): Promise<string[]> {
    const provinces = await readdir(dir).catch(() => []);
    const nested = await Promise.all(
      provinces.map(async (p) =>
        (await readdir(path.join(dir, p)).catch(() => []))
          .filter((f) => f.endsWith('.jsonl'))
          .map((f) => path.join(dir, p, f)),
      ),
    );
    return nested.flat();
  }

  return {
    read: (province, benefit) => readFileEntry(snapshotFile(dir, province, benefit)),

    async readAll() {
      const entries = await Promise.all((await listFiles()).map(readFileEntry));
      return entries.filter((e) => e !== null);
    },

    latestFetchedAt() {
      // The snapshot is a committed file set — read it once, /health may be polled often.
      latest ??= this.readAll().then(
        (entries) =>
          entries
            .map((e) => e.fetchedAt.slice(0, 10))
            .sort()
            .at(-1) ?? null,
      );
      return latest;
    },
  };
}
