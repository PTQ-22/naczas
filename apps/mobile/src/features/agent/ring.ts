/** Ticks around the saved-time ring; each is 1/60 of the circle. */
export const RING_TICKS = 60;

/**
 * How many of the ring's ticks go to waiting on the line and to talking. Both parts that exist
 * keep at least one tick, so a tiny share still shows up; no time at all leaves an empty ring.
 */
export function ringSegments(
  waitedSec: number,
  talkedSec: number,
  ticks = RING_TICKS,
): { waited: number; talked: number } {
  const total = waitedSec + talkedSec;
  if (total <= 0) return { waited: 0, talked: 0 };
  if (waitedSec <= 0) return { waited: 0, talked: ticks };
  if (talkedSec <= 0) return { waited: ticks, talked: 0 };
  const waited = Math.min(ticks - 1, Math.max(1, Math.round((waitedSec / total) * ticks)));
  return { waited, talked: ticks - waited };
}
