import { lastDoneLabel } from '../last-done-labels';

const labels = (interval: number) =>
  (['within_half_interval', 'within_interval', 'over_interval'] as const).map((a) =>
    lastDoneLabel(a, interval),
  );

describe('lastDoneLabel — buckets follow the exam interval', () => {
  it.each([
    [12, ['W ciągu ostatnich 6 miesięcy', '6–12 miesięcy temu', 'Ponad rok temu']],
    [24, ['W ostatnim roku', '1–2 lata temu', 'Ponad 2 lata temu']],
    [36, ['W ciągu ostatnich 18 miesięcy', '18–36 miesięcy temu', 'Ponad 3 lata temu']],
    [60, ['W ciągu ostatnich 30 miesięcy', '30–60 miesięcy temu', 'Ponad 5 lat temu']],
    [120, ['W ciągu ostatnich 5 lat', '5–10 lat temu', 'Ponad 10 lat temu']],
  ])('%i months', (interval, expected) => {
    expect(labels(interval)).toEqual(expected);
  });

  it('never / unknown do not depend on the interval', () => {
    expect(lastDoneLabel('never', 120)).toBe('Nigdy');
    expect(lastDoneLabel('unknown', 12)).toBe('Nie pamiętam');
  });
});
