import { applyDemoPreset } from '../demo-presets';

describe('applyDemoPreset', () => {
  const real = '2026-10-04';

  it('steps forward from the date the app currently uses', () => {
    expect(applyDemoPreset('plus1m', '2026-10-04', real)).toBe('2026-11-04');
    expect(applyDemoPreset('plus3m', '2026-11-30', real)).toBe('2027-02-28');
    expect(applyDemoPreset('plus1y', '2027-01-12', real)).toBe('2028-01-12');
  });

  it('pins the real date or turns the override off', () => {
    expect(applyDemoPreset('today', '2027-05-01', real)).toBe(real);
    expect(applyDemoPreset('reset', '2027-05-01', real)).toBeNull();
  });
});
