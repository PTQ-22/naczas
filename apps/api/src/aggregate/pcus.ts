/**
 * NFZ ITL v1.4 `dates.pcus` ("Prognozowany czas udzielenia świadczenia") → whole days.
 * Observed formats: "0 dni", "1 dzień", "13 dni", "1 mies. 3 tyg.", "13 mies. 1 tydz.".
 * A month counts as 30 days and a week as 7 — the value is a forecast, so this rounding is
 * far below its own precision. Anything unrecognised → null (treated as unknown, never 0).
 */
const UNIT_DAYS: ReadonlyArray<readonly [RegExp, number]> = [
  [/^(?:dni|dzie[nń]|d\.?)$/u, 1],
  [/^(?:tydz\.?|tyg\.?|tydzie[nń]|tygodnie|tygodni)$/u, 7],
  [/^(?:mies\.?|miesi[aą]c|miesi[aą]ce|miesi[eę]cy)$/u, 30],
];

const PART = /(\d+)\s*([\p{L}.]+)/gu;

export function parsePcusDays(input: string | null | undefined): number | null {
  if (input == null) return null;
  const text = input.trim().toLowerCase();
  if (text === '') return null;

  let days = 0;
  let consumed = '';
  for (const [, count, unit] of text.matchAll(PART)) {
    const perUnit = UNIT_DAYS.find(([re]) => re.test(unit!))?.[1];
    if (perUnit === undefined) return null;
    days += Number(count) * perUnit;
    consumed += `${count}${unit}`;
  }
  // Every non-space character must belong to a "<number> <unit>" part, so "ok. 3 dni",
  // "3-5 dni" or "brak" stay unknown instead of being half-parsed.
  return consumed !== '' && consumed === text.replace(/\s+/g, '') ? days : null;
}
