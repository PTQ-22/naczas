import { requireOptionalNativeModule } from 'expo';

import { eventTimes, type CalendarEventDraft } from './calendar-event';

export type CalendarResult = 'saved' | 'downloaded' | 'canceled' | 'denied' | 'unavailable';

/**
 * Opens the system "New event" sheet pre-filled with the draft; the user confirms with "Add".
 * iOS 17+: the sheet runs out of process, so no calendar permission is needed and we never
 * read the user's calendar. Older iOS / Android ask for permission on the first failure.
 */
export async function addToCalendar(draft: CalendarEventDraft): Promise<CalendarResult> {
  // Expo Go has no ExpoCalendar module and importing expo-calendar there throws at load time.
  if (!requireOptionalNativeModule('ExpoCalendar')) return 'unavailable';
  const Calendar = await import('expo-calendar/legacy');

  const { start, end } = eventTimes(draft);
  const event = {
    title: draft.title,
    notes: draft.notes,
    url: draft.url,
    startDate: start,
    endDate: end,
    allDay: draft.allDay,
    alarms: [{ relativeOffset: draft.alarmOffsetMinutes }],
  };

  const open = async (): Promise<CalendarResult> => {
    const { action } = await Calendar.createEventInCalendarAsync(event);
    // Android always reports 'done' (it can't tell save from cancel).
    const { saved, done } = Calendar.CalendarDialogResultActions;
    return action === saved || action === done ? 'saved' : 'canceled';
  };

  try {
    return await open();
  } catch {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) return 'denied';
    try {
      return await open();
    } catch {
      return 'unavailable';
    }
  }
}
