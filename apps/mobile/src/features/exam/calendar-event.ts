import { addDays, format, parseISO } from 'date-fns';

import type { ISODate, PlanItem } from '@naczas/shared';

import { t } from '@/i18n';

/**
 * One event for the user's own calendar (iOS Calendar / .ics). Platform-neutral on purpose:
 * the native adapter turns it into an EventKit form, the web adapter into an .ics file.
 */
export interface CalendarEventDraft {
  /** Stable per person+exam+kind, so re-adding the .ics updates instead of duplicating. */
  uid: string;
  kind: 'search' | 'visit';
  title: string;
  notes: string;
  url: string;
  date: ISODate;
  /** Visit: all-day (we don't know the hour). Search: 09:00–09:15 local. */
  allDay: boolean;
  /** Alarm offset in minutes relative to the event start (negative = before). */
  alarmOffsetMinutes: number;
  /** = today; the .ics DTSTAMP (no clock reads outside useToday). */
  createdOn: ISODate;
}

export const SEARCH_HOUR = 9;
export const SEARCH_DURATION_MIN = 15;
/** All-day visit starts at 00:00 → −15 h = 09:00 the day before (matches the visit notification). */
const VISIT_ALARM_OFFSET = -15 * 60;

const monthYear = (iso: ISODate) => format(parseISO(iso), 'MM.yyyy');
const nextDay = (iso: ISODate) => format(addDays(parseISO(iso), 1), 'yyyy-MM-dd');

interface BuildInput {
  item: PlanItem;
  examName: string;
  profileName: string;
  /** Deep link back into the app (Linking.createURL) — shown in the calendar event. */
  link: string;
  today: ISODate;
}

/**
 * Booked → reminder of the visit itself; otherwise → the day to start looking for an
 * appointment (our differentiator: notifyDate = dueDate − NFZ queue lead time).
 * A notifyDate that already passed becomes tomorrow — an event in the past reminds no one.
 */
export function buildCalendarEvent({
  item,
  examName,
  profileName,
  link,
  today,
}: BuildInput): CalendarEventDraft {
  const base = { exam: examName, name: profileName };
  if (item.urgency === 'booked') {
    return {
      uid: `${item.profileId}:${item.examId}:visit@naczas`,
      kind: 'visit',
      title: t('exam.calendar.visitTitle', base),
      notes: t('exam.calendar.visitNotes', { link }),
      url: link,
      date: item.dueDate,
      allDay: true,
      alarmOffsetMinutes: VISIT_ALARM_OFFSET,
      createdOn: today,
    };
  }
  return {
    uid: `${item.profileId}:${item.examId}:search@naczas`,
    kind: 'search',
    title: t('exam.calendar.searchTitle', base),
    notes: t('exam.calendar.searchNotes', { due: monthYear(item.dueDate), link }),
    url: link,
    date: item.notifyDate > today ? item.notifyDate : nextDay(today),
    allDay: false,
    alarmOffsetMinutes: 0,
    createdOn: today,
  };
}

/** Local start/end as Date objects — for EventKit (native adapter). */
export function eventTimes(draft: CalendarEventDraft): { start: Date; end: Date } {
  const start = parseISO(draft.date);
  if (draft.allDay) return { start, end: start };
  start.setHours(SEARCH_HOUR, 0, 0, 0);
  const end = new Date(start.getTime() + SEARCH_DURATION_MIN * 60_000);
  return { start, end };
}

// --- iCalendar (RFC 5545) -------------------------------------------------------------------

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const compact = (iso: ISODate) => iso.replace(/-/g, '');
const pad = (n: number) => String(n).padStart(2, '0');

function duration(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}PT${h ? `${h}H` : ''}${m || !h ? `${m}M` : ''}`;
}

/** Floating local times (no TZ) on purpose: "09:00 wherever the user is", like the app's alerts. */
export function toIcs(draft: CalendarEventDraft): string {
  const start = draft.allDay
    ? `DTSTART;VALUE=DATE:${compact(draft.date)}`
    : `DTSTART:${compact(draft.date)}T${pad(SEARCH_HOUR)}0000`;
  const end = draft.allDay
    ? `DTEND;VALUE=DATE:${compact(nextDay(draft.date))}`
    : `DTEND:${compact(draft.date)}T${pad(SEARCH_HOUR)}${pad(SEARCH_DURATION_MIN)}00`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NaCzas//PL',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${draft.uid}`,
    `DTSTAMP:${compact(draft.createdOn)}T000000Z`,
    start,
    end,
    `SUMMARY:${escapeText(draft.title)}`,
    `DESCRIPTION:${escapeText(draft.notes)}`,
    `URL:${draft.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(draft.title)}`,
    `TRIGGER:${duration(draft.alarmOffsetMinutes)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
