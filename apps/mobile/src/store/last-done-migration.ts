import { format, parseISO, subMonths } from 'date-fns';

import { ISODateSchema, LastDoneAnswerSchema } from '@naczas/shared';

/**
 * "Kiedy ostatnio?" answers used to be fixed buckets (within_1y / 1_3y / over_3y) kept in
 * records and re-read against each day's `today`. Records now keep a date (or an undated
 * answer), so old buckets become the date they stood for on the day they were saved.
 */
const OLD_BUCKET_MONTHS: Record<string, number> = { within_1y: 6, '1_3y': 24 };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function migrateRecord(record: unknown): unknown {
  if (!isRecord(record)) return record;
  const { lastDone, updatedAt } = record;
  if (lastDone === 'over_3y') return { ...record, lastDone: 'over_interval' };
  const months = typeof lastDone === 'string' ? OLD_BUCKET_MONTHS[lastDone] : undefined;
  const anchor = ISODateSchema.safeParse(updatedAt);
  if (months === undefined || !anchor.success) return record;
  return { ...record, lastDone: format(subMonths(parseISO(anchor.data), months), 'yyyy-MM-dd') };
}

/** records store v1 → v2 */
export function migrateRecordsV1(state: unknown): unknown {
  if (!isRecord(state) || !Array.isArray(state.records)) return state;
  return { ...state, records: state.records.map(migrateRecord) };
}

/**
 * onboarding-draft store v2 → v3: old answers don't map onto interval buckets (e.g. "1–3 lata"
 * vs a 10-year interval), so they are dropped and the last step is simply asked again.
 */
export function migrateDraftV2(state: unknown): unknown {
  if (!isRecord(state) || !isRecord(state.draft) || !isRecord(state.draft.lastDone)) return state;
  const lastDone = Object.fromEntries(
    Object.entries(state.draft.lastDone).filter(
      ([, answer]) => LastDoneAnswerSchema.safeParse(answer).success,
    ),
  );
  return { ...state, draft: { ...state.draft, lastDone } };
}
