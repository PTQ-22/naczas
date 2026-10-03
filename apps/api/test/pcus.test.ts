import { describe, expect, it } from 'vitest';

import { parsePcusDays } from '../src/aggregate/pcus';

describe('parsePcusDays', () => {
  it.each([
    ['0 dni', 0],
    ['1 dzień', 1],
    ['1 dzien', 1],
    ['13 dni', 13],
    ['2 tyg.', 14],
    ['1 tydz.', 7],
    ['3 mies.', 90],
    ['1 mies. 3 tyg.', 51],
    ['13 mies. 1 tydz.', 397],
    ['2 mies. 1 tyg. 3 dni', 70],
    ['  1 MIES.  3 TYG. ', 51], // case and spacing don't matter
    ['5 tygodni', 35],
    ['2 miesiące', 60],
  ])('%s → %i days', (input, days) => {
    expect(parsePcusDays(input)).toBe(days);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty', ''],
    ['whitespace', '   '],
    ['no number', 'dni'],
    ['no unit', '13'],
    ['unknown unit', '3 lata'],
    ['range', '3-5 dni'],
    ['prefix text', 'ok. 3 dni'],
    ['trailing text', '3 dni lub więcej'],
    ['free text', 'brak danych'],
  ])('%s → null (unknown, never 0)', (_name, input) => {
    expect(parsePcusDays(input)).toBeNull();
  });
});
