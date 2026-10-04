import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { t } from '@/i18n';
import type { CallTask } from '@/store';

/** 75 → "1:15" (call clock) */
export const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Summary length: "45 s", "12 min", "1 h 5 min" */
export function duration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return t('callAssist.duration.seconds', { n: s });
  const min = Math.round(s / 60);
  if (min < 60) return t('callAssist.duration.minutes', { n: min });
  return t('callAssist.duration.hours', { h: Math.floor(min / 60), m: min % 60 });
}

const HOUR = 60 * 60_000;

/** "Nikt nie odebrał · ponowię za 7:42" — or the day and hour when the retry is far away. */
function retryLine(task: CallTask, now: number): string {
  const nextAt = task.attempt?.nextAt ? Date.parse(task.attempt.nextAt) : NaN;
  if (Number.isNaN(nextAt)) return t('callAssist.status.retry_soon');
  const left = nextAt - now;
  if (left > HOUR) {
    return t('callAssist.status.retry_at', {
      when: format(nextAt, 'EEEEEE HH:mm', { locale: pl }),
    });
  }
  return t('callAssist.status.retry_in', { time: clock(left / 1000) });
}

/** One line for the current state of an agent task (call screen and "Moje zlecenia"). */
export function taskStatusLine(task: CallTask, now: number): string {
  const attempt = task.attempt;
  switch (task.status) {
    case 'queued':
      return t('callAssist.status.queued');
    case 'ringing':
      return attempt && attempt.number > 1
        ? t('callAssist.status.ringing_attempt', { n: attempt.number, max: attempt.max })
        : t('callAssist.status.ringing');
    case 'on_hold':
      return t('callAssist.status.on_hold', { time: clock(task.stats?.waitedSec ?? 0) });
    case 'in_progress':
      return t('callAssist.status.in_progress', { time: clock(task.stats?.talkedSec ?? 0) });
    case 'retry_scheduled':
      return retryLine(task, now);
    case 'ended':
      if (task.result?.booked && task.result.date) {
        return t('callAssist.status.booked', {
          date: format(task.result.date, 'd.MM', { locale: pl }),
        });
      }
      return task.closed ? t('callAssist.status.ended') : t('callAssist.status.analysing');
    case 'failed':
      return t('callAssist.status.failed');
    case 'cancelled':
      return t('callAssist.status.cancelled');
  }
}
