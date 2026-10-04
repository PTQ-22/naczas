/**
 * When the agent may (re)dial a clinic: registration desks answer on weekdays, so a retry that
 * would fall at night or on a weekend waits for the next opening. Clinic time is Polish time,
 * whatever the server's time zone (Render runs in UTC).
 */

const TIME_ZONE = 'Europe/Warsaw';
/** Mon–Fri 7:30–18:00 — typical NFZ registration hours */
export const CLINIC_OPEN_MIN = 7 * 60 + 30;
export const CLINIC_CLOSE_MIN = 18 * 60;

const MINUTE = 60_000;

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

/** Offset of Polish time from UTC at `ms`, in minutes (60 in winter, 120 in summer). */
function warsawOffsetMin(ms: number): number {
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(ms)).map((p) => [p.type, Number(p.value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>;
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((wall - Math.floor(ms / MINUTE) * MINUTE) / MINUTE);
}

/** Polish wall clock at `ms`: ISO weekday (1 = Mon) and minutes since midnight. */
function warsawClock(ms: number) {
  const local = new Date(ms + warsawOffsetMin(ms) * MINUTE);
  const day = local.getUTCDay();
  return {
    weekday: day === 0 ? 7 : day,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
    local,
  };
}

export function inClinicHours(ms: number): boolean {
  const { weekday, minutes } = warsawClock(ms);
  return weekday <= 5 && minutes >= CLINIC_OPEN_MIN && minutes < CLINIC_CLOSE_MIN;
}

/** First moment at or after `ms` when the clinic is open. */
export function nextClinicOpening(ms: number): number {
  if (inClinicHours(ms)) return ms;
  const { weekday, minutes, local } = warsawClock(ms);
  // Days to add to reach the next opening day (today if it's a weekday before opening).
  let days = weekday <= 5 && minutes < CLINIC_OPEN_MIN ? 0 : 1;
  let nextWeekday = ((weekday - 1 + days) % 7) + 1;
  while (nextWeekday > 5) {
    days++;
    nextWeekday = ((weekday - 1 + days) % 7) + 1;
  }
  const wall = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + days,
    0,
    CLINIC_OPEN_MIN,
  );
  // Wall time → instant; the offset is taken at the result, so a DST switch in between is right.
  const guess = wall - warsawOffsetMin(wall) * MINUTE;
  return wall - warsawOffsetMin(guess) * MINUTE;
}

/** When to dial again after an unanswered attempt that ended at `endedAtMs`. */
export const nextCallAttemptAt = (endedAtMs: number, intervalMs: number) =>
  nextClinicOpening(endedAtMs + intervalMs);
