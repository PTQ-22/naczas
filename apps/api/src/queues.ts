import { NfzUnavailableError, type NfzClient } from './nfz/client';

import type { NfzQueue } from './nfz/schemas';
import type { SnapshotStore } from './nfz/snapshot';

export type DataSource = 'nfz_live' | 'nfz_snapshot';

export interface LoadedQueues {
  queues: NfzQueue[];
  source: DataSource;
  /** 'YYYY-MM' — month of the data when a record has no statistics.update */
  fallbackMonth: string;
}

/** Neither live NFZ nor the snapshot could serve the request. */
export class DataUnavailableError extends Error {
  override name = 'DataUnavailableError';
}

export interface QueueLoaderDeps {
  nfz: NfzClient;
  snapshot: SnapshotStore;
  now: () => Date;
}

export interface QueueLoader {
  load(province: string, benefits: readonly string[]): Promise<LoadedQueues>;
  /** Result of the most recent live NFZ call ('up' until a call fails). */
  nfzStatus(): 'up' | 'down';
}

/** Live NFZ first; if any benefit fails, serve all of them from the snapshot (one consistent source). */
export function createQueueLoader({ nfz, snapshot, now }: QueueLoaderDeps): QueueLoader {
  let lastLiveOk = true;

  async function loadLive(province: string, benefits: readonly string[]) {
    const queues: NfzQueue[] = [];
    for (const benefit of benefits) {
      queues.push(...(await nfz.getQueues({ benefit, province })));
    }
    return queues;
  }

  async function loadSnapshot(
    province: string,
    benefits: readonly string[],
  ): Promise<LoadedQueues> {
    const entries = await Promise.all(benefits.map((b) => snapshot.read(province, b)));
    const found = entries.filter((e) => e !== null);
    if (found.length === 0) {
      throw new DataUnavailableError(`No live NFZ data and no snapshot for province ${province}`);
    }
    const oldest = found.map((e) => e.fetchedAt).sort()[0]!;
    return {
      queues: found.flatMap((e) => e.queues),
      source: 'nfz_snapshot',
      fallbackMonth: oldest.slice(0, 7),
    };
  }

  return {
    async load(province, benefits) {
      try {
        const queues = await loadLive(province, benefits);
        lastLiveOk = true;
        return { queues, source: 'nfz_live', fallbackMonth: now().toISOString().slice(0, 7) };
      } catch (err) {
        if (!(err instanceof NfzUnavailableError)) throw err;
        lastLiveOk = false;
        return loadSnapshot(province, benefits);
      }
    },
    nfzStatus: () => (lastLiveOk ? 'up' : 'down'),
  };
}
