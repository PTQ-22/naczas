import { lastDoneLabel } from '../last-done-labels';

const labels = (interval: number) =>
  (['within_half_interval', 'within_interval', 'over_interval'] as const).map((a) =>
    lastDoneLabel(a, interval),
  );

describe('lastDoneLabel — buckets follow the exam interval', () => {
  it.each([
    [12, ['W ciągu ostatnich 6 miesięcy', '6–12 miesięcy temu', 'Ponad rok temu']],
    [24, ['W ostatnim roku', '1–2 lata temu', 'Ponad 2 lata temu']],
    [36, ['W ciągu ostatnich półtora roku', '1,5–3 lata temu', 'Ponad 3 lata temu']],
    [60, ['W ciągu ostatnich 2,5 roku', '2,5–5 lat temu', 'Ponad 5 lat temu']],
    [108, ['W ciągu ostatnich 4,5 roku', '4,5–9 lat temu', 'Ponad 9 lat temu']],
    [30, ['W ciągu ostatnich 15 miesięcy', '15–30 miesięcy temu', 'Ponad 2,5 roku temu']],
    [44, ['W ciągu ostatnich 22 miesięcy', '22–44 miesiące temu', 'Ponad 44 miesiące temu']],
    [120, ['W ciągu ostatnich 5 lat', '5–10 lat temu', 'Ponad 10 lat temu']],
  ])('%i months', (interval, expected) => {
    expect(labels(interval)).toEqual(expected);
  });

  it('never / unknown do not depend on the interval', () => {
    expect(lastDoneLabel('never', 120)).toBe('Nigdy');
    expect(lastDoneLabel('unknown', 12)).toBe('Nie pamiętam');
  });
});
