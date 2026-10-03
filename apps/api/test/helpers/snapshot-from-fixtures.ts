import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { loadAllFixtures } from './nfz-fixtures';
import { selectAdultQueues } from '../../src/aggregate/normalize';
import { NfzQueueSchema } from '../../src/nfz/schemas';
import { writeSnapshot } from '../../src/nfz/snapshot';

/**
 * Writes the recorded fixtures as a snapshot (same filtering as scripts/snapshot.ts) into a
 * temp dir, so fallback tests use the real snapshot format without committing test data twice.
 */
export async function buildSnapshotFromFixtures(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'naczas-snapshot-'));
  for (const fixture of loadAllFixtures()) {
    const { benefit, province } = fixture.request;
    const queues = fixture.pages.flatMap((p) => p.data).map((r) => NfzQueueSchema.parse(r));
    await writeSnapshot(
      dir,
      { benefit, province, case: 1, fetchedAt: fixture.fetchedAt },
      selectAdultQueues(queues, [benefit]),
    );
  }
  return dir;
}
