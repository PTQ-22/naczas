import type { Weekday } from '@naczas/shared';

import type { Slot } from '@/store/availability-store';

import {
  rangeFromDrag,
  shiftEdge,
  slotsOn,
  toCallAvailability,
  weekDays,
  weeklySummary,
  weekStart,
  withRepeat,
} from '../availability';

const weekly = (weekday: Weekday, from: string, to: string): Slot => ({
  id: `w${weekday}${from}`,
  repeat: 'weekly',
  weekday,
  from,
  to,
});
const once = (date: string, from: string, to: string): Slot => ({
  id: `o${date}${from}`,
  repeat: 'once',
  date,
  from,
  to,
});

describe('week view helpers', () => {
  it('builds a Monday-first week around any day', () => {
    expect(weekStart('2026-10-21')).toBe('2026-10-19');
    expect(weekDays('2026-10-26')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('a drag snaps outward to half hours, either direction; a tap gives one hour', () => {
    expect(rangeFromDrag(10 * 60 + 10, 14 * 60 + 50)).toEqual({ from: '10:00', to: '15:00' });
    expect(rangeFromDrag(15 * 60, 10 * 60)).toEqual({ from: '10:00', to: '15:00' });
    expect(rangeFromDrag(9 * 60 + 40, 9 * 60 + 40)).toEqual({ from: '09:30', to: '10:30' });
    // Clamped to the grid (7:00–21:00)
    expect(rangeFromDrag(20 * 60 + 50, 20 * 60 + 50)).toEqual({ from: '20:00', to: '21:00' });
    expect(rangeFromDrag(5 * 60, 8 * 60)).toEqual({ from: '07:00', to: '08:00' });
  });

  it('± moves one edge and never inverts the block', () => {
    const s = once('2026-10-21', '10:00', '10:30');
    expect(shiftEdge(s, 'to', 30)).toMatchObject({ from: '10:00', to: '11:00' });
    expect(shiftEdge(s, 'from', 30)).toMatchObject({ from: '10:00', to: '10:30' });
    expect(shiftEdge(s, 'from', -30)).toMatchObject({ from: '09:30', to: '10:30' });
  });

  it('"Powtarzaj co tydzień" turns a one-off into a weekly block and back', () => {
    const s = once('2026-10-19', '10:00', '15:00'); // Monday
    const w = withRepeat(s, true, '2026-10-19');
    expect(w).toEqual({ id: s.id, from: '10:00', to: '15:00', repeat: 'weekly', weekday: 1 });
    expect(slotsOn([w], '2026-11-02')).toEqual([w]); // every Monday
    expect(slotsOn([w], '2026-11-03')).toEqual([]);
    expect(withRepeat(w, false, '2026-11-02')).toMatchObject({
      repeat: 'once',
      date: '2026-11-02',
    });
  });

  it('sends weekly blocks grouped by hours and upcoming one-offs; nothing when empty', () => {
    expect(toCallAvailability([], '2026-10-04')).toBeUndefined();
    const slots = [
      weekly(2, '17:00', '20:00'),
      weekly(1, '17:00', '20:00'),
      weekly(6, '09:00', '12:00'),
      once('2026-10-01', '09:00', '10:00'), // past
      once('2026-10-21', '10:00', '15:00'),
    ];
    expect(toCallAvailability(slots, '2026-10-04')).toEqual({
      weekly: [
        { days: [1, 2], from: '17:00', to: '20:00' },
        { days: [6], from: '09:00', to: '12:00' },
      ],
      dates: [{ date: '2026-10-21', from: '10:00', to: '15:00' }],
    });
    expect(weeklySummary(slots)).toEqual(['Pn, Wt 17:00–20:00', 'So 09:00–12:00']);
    expect(
      weeklySummary(([1, 2, 3, 4, 5] as const).map((d) => weekly(d, '17:00', '20:00'))),
    ).toEqual(['Pn–Pt 17:00–20:00']);
  });
});
