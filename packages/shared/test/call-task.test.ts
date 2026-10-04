import { describe, expect, it } from 'vitest';

import {
  cancelSimulatedCall,
  createSimulatedCallTask,
  inClinicHours,
  nextCallAttemptAt,
  nextClinicOpening,
  retrySimulatedCallNow,
  SIMULATED_RETRY_INTERVAL_MS,
  simulatedCallStatus,
  type CallAssistRequest,
} from '../src';

const req: CallAssistRequest = {
  examName: 'kolonoskopię',
  facilityName: 'X',
  forWhom: 'mamę',
  callerName: 'Kasi',
};
const T0 = 1_000_000;

describe('simulated call task (demo)', () => {
  const task = createSimulatedCallTask(req, '2026-10-04', T0);
  const at = (ms: number) => simulatedCallStatus('c', task, T0 + ms);

  it('first attempt rings out, then a retry is scheduled with a countdown', () => {
    expect(at(1000)).toMatchObject({ status: 'ringing', attempt: { number: 1, max: 3 } });
    const waiting = at(7000);
    expect(waiting.status).toBe('retry_scheduled');
    expect(waiting.attempt?.nextAt).toBe(
      new Date(T0 + 6000 + SIMULATED_RETRY_INTERVAL_MS).toISOString(),
    );
    expect(waiting.stats).toEqual({ attempts: 1, waitedSec: 6, talkedSec: 0 });
  });

  it('second attempt is answered: on hold, then the talk, then booked', () => {
    const second = T0 + 6000 + SIMULATED_RETRY_INTERVAL_MS;
    const s = (ms: number) => simulatedCallStatus('c', task, second + ms);
    expect(s(1000)).toMatchObject({ status: 'ringing', attempt: { number: 2 } });
    expect(s(5000).status).toBe('on_hold');
    expect(s(9000).status).toBe('in_progress');
    const end = s(60_000);
    expect(end).toMatchObject({ status: 'ended', result: { booked: true } });
    // 6 s ringing out + 7.5 s ringing/hold on attempt 2; talk is the whole script.
    expect(end.stats).toMatchObject({ attempts: 2, waitedSec: 14 });
    expect(end.stats?.talkedSec).toBeGreaterThan(15);
  });

  it('"Zadzwoń teraz" skips the wait', () => {
    const now = T0 + 7000;
    const sooner = retrySimulatedCallNow(task, now);
    expect(simulatedCallStatus('c', sooner, now + 1000)).toMatchObject({
      status: 'ringing',
      attempt: { number: 2 },
    });
    // Not waiting → no-op.
    expect(retrySimulatedCallNow(task, T0 + 1000)).toEqual(task);
  });

  it('cancel freezes the task; a finished task cannot be cancelled', () => {
    const cancelled = cancelSimulatedCall(task, T0 + 7000);
    const later = simulatedCallStatus('c', cancelled, T0 + 120_000);
    expect(later.status).toBe('cancelled');
    expect(later.stats?.attempts).toBe(1);
    const done = cancelSimulatedCall(task, T0 + 120_000);
    expect(simulatedCallStatus('c', done, T0 + 130_000).status).toBe('ended');
  });

  it('with one attempt only it is answered straight away', () => {
    const single = createSimulatedCallTask(
      { ...req, retry: { maxAttempts: 1, intervalMin: 10 } },
      '2026-10-04',
      T0,
    );
    expect(simulatedCallStatus('c', single, T0 + 5000).status).toBe('on_hold');
  });
});

describe('clinic hours (Polish time)', () => {
  // 2026-10-05 is a Monday; Poland is UTC+2 until 25.10, then UTC+1.
  const utc = (iso: string) => Date.parse(iso);

  it('knows when registration is open', () => {
    expect(inClinicHours(utc('2026-10-05T05:30:00Z'))).toBe(true); // Mon 7:30 PL
    expect(inClinicHours(utc('2026-10-05T05:29:00Z'))).toBe(false); // Mon 7:29
    expect(inClinicHours(utc('2026-10-05T16:00:00Z'))).toBe(false); // Mon 18:00
    expect(inClinicHours(utc('2026-10-10T08:00:00Z'))).toBe(false); // Sat
  });

  it('moves a retry outside the hours to the next opening', () => {
    const tenMin = 10 * 60_000;
    // Mon 17:55 PL + 10 min → Tue 7:30 PL
    expect(new Date(nextCallAttemptAt(utc('2026-10-05T15:55:00Z'), tenMin)).toISOString()).toBe(
      '2026-10-06T05:30:00.000Z',
    );
    // Fri 17:59 → Mon 7:30
    expect(new Date(nextClinicOpening(utc('2026-10-09T16:05:00Z'))).toISOString()).toBe(
      '2026-10-12T05:30:00.000Z',
    );
    // Inside hours: just the interval.
    expect(nextCallAttemptAt(utc('2026-10-05T08:00:00Z'), tenMin)).toBe(
      utc('2026-10-05T08:10:00Z'),
    );
  });

  it('handles the DST switch (Sat 24.10 → Mon 26.10 is UTC+1)', () => {
    expect(new Date(nextClinicOpening(utc('2026-10-24T10:00:00Z'))).toISOString()).toBe(
      '2026-10-26T06:30:00.000Z',
    );
  });
});
