import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { type NfzQueue, NfzQueuesPageSchema } from './schemas';
import { benefitSlug } from './slug';

/** Same layout as test fixtures: <dir>/<province>/<benefit-slug>.json with raw NFZ pages. */
export interface SnapshotEntry {
  queues: NfzQueue[];
  /** ISO timestamp of the recording */
  fetchedAt: string;
}

export interface SnapshotStore {
  read(province: string, benefit: string): Promise<SnapshotEntry | null>;
  /** 'YYYY-MM-DD' of the newest recording, null when the snapshot is empty */
  latestFetchedAt(): Promise<string | null>;
}

interface SnapshotFile {
  fetchedAt?: unknown;
  pages?: unknown;
}

export function createSnapshotStore(dir: string): SnapshotStore {
  async function readJson(file: string): Promise<SnapshotFile | null> {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as SnapshotFile;
    } catch {
      return null; // missing or unreadable file = no snapshot for this key
    }
  }

  return {
    async read(province, benefit) {
      const file = await readJson(path.join(dir, province, `${benefitSlug(benefit)}.json`));
      if (!file || typeof file.fetchedAt !== 'string' || !Array.isArray(file.pages)) return null;
      const pages = file.pages.map((p) => NfzQueuesPageSchema.parse(p));
      return { queues: pages.flatMap((p) => p.data), fetchedAt: file.fetchedAt };
    },

    async latestFetchedAt() {
      let latest: string | null = null;
      const provinces = await readdir(dir).catch(() => []);
      for (const province of provinces) {
        const files = await readdir(path.join(dir, province)).catch(() => []);
        for (const name of files.filter((f) => f.endsWith('.json'))) {
          const file = await readJson(path.join(dir, province, name));
          const at = typeof file?.fetchedAt === 'string' ? file.fetchedAt.slice(0, 10) : null;
          if (at && (!latest || at > latest)) latest = at;
        }
      }
      return latest;
    },
  };
}
