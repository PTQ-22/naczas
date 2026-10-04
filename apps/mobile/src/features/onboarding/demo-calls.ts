import { addHours, format, parseISO, subDays } from 'date-fns';

import {
  createSimulatedCallTask,
  simulatedCallStatus,
  type CallAssistRequest,
  type CallAssistStatus,
  type ISODate,
} from '@naczas/shared';

import type { CallTask } from '@/store';

import { DEMO_KASIA_ID, DEMO_MAMA_ID } from './demo-ids';

/** Fixed ids: loading the demo again replaces these calls instead of adding duplicates. */
const ID = (n: number) => `demo-call-${n}`;

/** The scripted conversation the agent's simulation tells, as it ends. */
function scripted(req: CallAssistRequest, today: ISODate): CallAssistStatus {
  const task = createSimulatedCallTask(
    { ...req, retry: { maxAttempts: 1, intervalMin: 10 } },
    today,
    0,
  );
  return simulatedCallStatus('demo', task, 10 * 60_000);
}

/**
 * "Moje zlecenia" for the demo: a few finished calls so the Agent tab has history, a saved-time
 * total and conversations to open. Mock data (mode 'simulated'); phone times are typical
 * registration-desk waits picked for the demo, not measurements.
 */
export function buildDemoCalls(today: ISODate): CallTask[] {
  const day = parseISO(today);
  const at = (daysAgo: number, hour: number) => addHours(subDays(day, daysAgo), hour).getTime();
  // Each call books relative to the day it was made, so the visits don't all share one date.
  const dayOf = (daysAgo: number): ISODate => format(subDays(day, daysAgo), 'yyyy-MM-dd');
  const base = { mode: 'simulated' as const, applied: true, closed: true, attempt: undefined };
  const mamaReq = { forWhom: 'mamę', callerName: 'Kasi' };

  const dentist = scripted(
    {
      ...mamaReq,
      examName: 'przegląd u dentysty',
      facilityName: 'Przychodnia Stomatologiczna Jeżyce',
    },
    dayOf(9),
  );
  // Calendar marked "afternoons only" → the agent declines 10:30 and books a slot that fits.
  const eye = scripted(
    {
      ...mamaReq,
      examName: 'badanie u okulisty',
      facilityName: 'Poradnia Okulistyczna Wilda',
      availability: { weekly: [{ days: [1, 2, 3, 4, 5], from: '16:00', to: '19:00' }], dates: [] },
    },
    dayOf(1),
  );
  const derm = scripted(
    {
      examName: 'kontrolę znamion',
      facilityName: 'Centrum Dermatologii Grunwald',
      forWhom: 'ją',
      callerName: 'Kasi',
    },
    dayOf(3),
  );

  const call = (
    n: number,
    profileId: string,
    examId: string,
    facilityName: string,
    createdAt: number,
    status: CallAssistStatus,
    stats: NonNullable<CallAssistStatus['stats']>,
  ): CallTask => ({
    ...base,
    id: ID(n),
    profileId,
    examId,
    facilityName,
    createdAt,
    updatedAt: createdAt + (stats.waitedSec + stats.talkedSec) * 1000,
    status: status.status,
    result: status.result,
    transcript: status.transcript,
    stats,
  });

  return [
    call(1, DEMO_MAMA_ID, 'eye_check', 'Poradnia Okulistyczna Wilda', at(1, 9), eye, {
      attempts: 2,
      waitedSec: 23 * 60 + 40,
      talkedSec: 4 * 60 + 10,
    }),
    call(2, DEMO_KASIA_ID, 'dermatolog', 'Centrum Dermatologii Grunwald', at(3, 11), derm, {
      attempts: 1,
      waitedSec: 17 * 60 + 5,
      talkedSec: 3 * 60 + 20,
    }),
    // Nobody picked up in any of the three tries — no conversation to show.
    {
      ...base,
      id: ID(3),
      profileId: DEMO_MAMA_ID,
      examId: 'neurolog',
      facilityName: 'Poradnia Neurologiczna Rataje',
      createdAt: at(5, 8),
      updatedAt: at(5, 8) + 40 * 60_000,
      status: 'failed',
      result: null,
      transcript: [],
      stats: { attempts: 3, waitedSec: 3 * 60, talkedSec: 0 },
    },
    call(
      4,
      DEMO_MAMA_ID,
      'dental_checkup',
      'Przychodnia Stomatologiczna Jeżyce',
      at(9, 10),
      dentist,
      {
        attempts: 1,
        waitedSec: 31 * 60 + 15,
        talkedSec: 3 * 60 + 45,
      },
    ),
  ];
}
