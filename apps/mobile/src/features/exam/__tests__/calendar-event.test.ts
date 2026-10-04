import type { PlanItem } from '@naczas/shared';

import { buildCalendarEvent, eventTimes, toIcs } from '../calendar-event';

const TODAY = '2026-10-04';
const LINK = 'naczas://exam/colonoscopy_screening';

const item = (over: Partial<PlanItem>): PlanItem => ({
  examId: 'colonoscopy_screening',
  profileId: 'mama',
  dueDate: '2027-03-01',
  notifyDate: '2026-11-10',
  leadTimeDays: 120,
  leadTimeSource: 'nfz_live',
  urgency: 'this_year',
  reasons: [],
  overdue: false,
  ...over,
});

const build = (over: Partial<PlanItem>, visitTime?: string) =>
  buildCalendarEvent({
    item: item(over),
    examName: 'Kolonoskopia',
    profileName: 'Mama',
    link: LINK,
    today: TODAY,
    visitTime,
  });

describe('buildCalendarEvent', () => {
  it('future notifyDate → "start looking" event that day at 09:00', () => {
    const e = build({});
    expect(e.kind).toBe('search');
    expect(e.date).toBe('2026-11-10');
    expect(e.allDay).toBe(false);
    expect(e.title).toBe('Zacznij szukać terminu: Kolonoskopia (Mama)');
    expect(e.notes).toContain('03.2027');
    expect(e.notes).toContain(LINK);
    expect(e.uid).toBe('mama:colonoscopy_screening:search@naczas');
    const { start, end } = eventTimes(e);
    expect([start.getHours(), start.getMinutes()]).toEqual([9, 0]);
    expect(end.getTime() - start.getTime()).toBe(15 * 60_000);
  });

  it('notifyDate already passed (act_now) → tomorrow, never a past event', () => {
    expect(build({ urgency: 'act_now', notifyDate: '2026-06-01' }).date).toBe('2026-10-05');
    expect(build({ urgency: 'act_now', notifyDate: TODAY }).date).toBe('2026-10-05');
  });

  it('booked → all-day visit with an alarm at 09:00 the day before', () => {
    const e = build({ urgency: 'booked', dueDate: '2026-10-20' });
    expect(e.kind).toBe('visit');
    expect(e.date).toBe('2026-10-20');
    expect(e.allDay).toBe(true);
    expect(e.alarmOffsetMinutes).toBe(-15 * 60);
    expect(e.title).toBe('Wizyta: Kolonoskopia (Mama)');
  });

  it('booked with a known hour → 1 h timed visit, alarm a day before', () => {
    const e = build({ urgency: 'booked', dueDate: '2026-10-20' }, '10:30');
    expect(e.allDay).toBe(false);
    expect(e.startTime).toBe('10:30');
    expect(e.alarmOffsetMinutes).toBe(-24 * 60);
    const { start, end } = eventTimes(e);
    expect([start.getHours(), start.getMinutes()]).toEqual([10, 30]);
    expect(end.getTime() - start.getTime()).toBe(60 * 60_000);
  });
});

describe('toIcs', () => {
  it('timed event: floating local times, alarm at start, CRLF lines', () => {
    const ics = toIcs(build({}));
    expect(ics).toContain('\r\nDTSTART:20261110T090000\r\n');
    expect(ics).toContain('\r\nDTEND:20261110T091500\r\n');
    expect(ics).toContain('\r\nTRIGGER:PT0M\r\n');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });

  it('all-day visit: DATE values, end is the next day, alarm 15 h before', () => {
    const ics = toIcs(build({ urgency: 'booked', dueDate: '2026-10-20' }));
    expect(ics).toContain('DTSTART;VALUE=DATE:20261020');
    expect(ics).toContain('DTEND;VALUE=DATE:20261021');
    expect(ics).toContain('TRIGGER:-PT15H');
  });

  it('timed visit: start at the visit hour, 1 h long, alarm 24 h before', () => {
    const ics = toIcs(build({ urgency: 'booked', dueDate: '2026-10-20' }, '10:30'));
    expect(ics).toContain('\r\nDTSTART:20261020T103000\r\n');
    expect(ics).toContain('\r\nDTEND:20261020T113000\r\n');
    expect(ics).toContain('TRIGGER:-PT24H');
  });

  it('timed visit late in the evening ends on the next day', () => {
    const ics = toIcs(build({ urgency: 'booked', dueDate: '2026-10-20' }, '23:30'));
    expect(ics).toContain('\r\nDTEND:20261021T003000\r\n');
  });

  it('escapes commas, semicolons and newlines in text', () => {
    const ics = toIcs({ ...build({}), title: 'a, b; c', notes: 'x\ny' });
    expect(ics).toContain('SUMMARY:a\\, b\\; c');
    expect(ics).toContain('DESCRIPTION:x\\ny');
  });
});
