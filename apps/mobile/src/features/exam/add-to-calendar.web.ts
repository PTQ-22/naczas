import { toIcs, type CalendarEventDraft } from './calendar-event';

import type { CalendarResult } from './add-to-calendar';

/** Web: download an .ics file — Safari/macOS and Outlook open it straight in the calendar. */
export function addToCalendar(draft: CalendarEventDraft): Promise<CalendarResult> {
  const blob = new Blob([toIcs(draft)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `naczas-${draft.kind}-${draft.uid.split(':')[1] ?? 'badanie'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke later: Safari cancels the download if the URL dies in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve('downloaded');
}
