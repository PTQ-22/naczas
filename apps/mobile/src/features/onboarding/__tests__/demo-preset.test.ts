import { computePlan } from '@naczas/rules';
import { ExamRecordSchema, ProfileSchema } from '@naczas/shared';

import {
  recordsForProfile,
  resetAllData,
  savedTime,
  useCallTasksStore,
  useProfilesStore,
  useRecordsStore,
} from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';
import { useAvailabilityStore } from '@/store/availability-store';

import { buildDemoCalls } from '../demo-calls';
import { buildDemoPreset, DEMO_KASIA_ID, DEMO_MAMA_ID, loadDemoPreset } from '../demo-preset';

const TODAY = '2026-10-04';

function planFor(profileId: string) {
  const { profiles, records } = buildDemoPreset(TODAY);
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) throw new Error(`no ${profileId}`);
  return computePlan({ profile, records, waitTimes: {}, today: TODAY });
}

beforeEach(() => resetAllData());

describe('buildDemoPreset', () => {
  it('builds contract-valid Mama (58) and Kasia (34) in Warsaw', () => {
    const { profiles, records } = buildDemoPreset(TODAY);
    profiles.forEach((p) => ProfileSchema.parse(p));
    records.forEach((r) => ExamRecordSchema.parse(r));
    expect(profiles.map((p) => [p.name, 2026 - p.birthYear, p.location?.label])).toEqual([
      ['Mama', 58, 'Poznań, woj. wielkopolskie'],
      ['Kasia', 34, 'Poznań, woj. wielkopolskie'],
    ]);
  });

  it("puts Mama's never-done colonoscopy on top as the only red card", () => {
    const items = planFor(DEMO_MAMA_ID).items;
    expect(items[0]?.examId).toBe('colonoscopy_screening');
    expect(items.filter((i) => i.urgency === 'act_now').map((i) => i.examId)).toEqual([
      'colonoscopy_screening',
    ]);
    const urgency = Object.fromEntries(items.map((i) => [i.examId, i.urgency]));
    expect(urgency.mammography).toBe('booked');
    expect(urgency.health_check_adult).toBe('done');
    expect(items.find((i) => i.examId === 'mammography')?.dueDate).toBe('2026-10-18');
  });

  it("makes cervical screening Kasia's only red card", () => {
    const { items } = planFor(DEMO_KASIA_ID);
    expect(items.filter((i) => i.urgency === 'act_now').map((i) => i.examId)).toEqual([
      'cervical_screening',
    ]);
  });
});

describe('loadDemoPreset', () => {
  it('adds both profiles with records and activates Mama', () => {
    loadDemoPreset(TODAY);
    const { profiles, activeProfileId } = useProfilesStore.getState();
    expect(profiles.map((p) => p.id)).toEqual([DEMO_MAMA_ID, DEMO_KASIA_ID]);
    expect(activeProfileId).toBe(DEMO_MAMA_ID);
    expect(recordsForProfile(useRecordsStore.getState().records, DEMO_KASIA_ID)).toHaveLength(4);
  });

  it('replaces an earlier preset instead of duplicating, and keeps own profiles', () => {
    useProfilesStore.getState().addProfile(makeProfile({ id: 'own', name: 'Ja' }));
    loadDemoPreset(TODAY);
    useRecordsStore.getState().markDone(DEMO_MAMA_ID, 'colonoscopy_screening', TODAY);
    loadDemoPreset(TODAY);

    const ids = useProfilesStore.getState().profiles.map((p) => p.id);
    expect(ids.sort()).toEqual([DEMO_KASIA_ID, DEMO_MAMA_ID, 'own'].sort());
    const colonoscopy = useRecordsStore
      .getState()
      .records.filter((r) => r.profileId === DEMO_MAMA_ID && r.examId === 'colonoscopy_screening');
    expect(colonoscopy).toEqual([expect.objectContaining({ status: 'none', lastDone: 'never' })]);
    expect(useProfilesStore.getState().activeProfileId).toBe(DEMO_MAMA_ID);
  });
});

describe('demo calendar', () => {
  it('Kasia cannot come Mon–Tue mornings, so the first morning offer gets declined', () => {
    loadDemoPreset(TODAY);
    loadDemoPreset(TODAY); // reload must not duplicate
    const slots = useAvailabilityStore.getState().byProfile[DEMO_KASIA_ID];
    expect(slots).toEqual([
      expect.objectContaining({ weekday: 1, from: '08:00', to: '12:00', kind: 'busy' }),
      expect.objectContaining({ weekday: 2, from: '08:00', to: '12:00', kind: 'busy' }),
    ]);
  });
});

describe('demo agent calls', () => {
  it('loading the demo fills the Agent history with mock calls, once', () => {
    loadDemoPreset(TODAY);
    loadDemoPreset(TODAY);
    const tasks = useCallTasksStore.getState().tasks;
    expect(tasks.map((x) => x.id).sort()).toEqual([
      'demo-call-1',
      'demo-call-2',
      'demo-call-3',
      'demo-call-4',
    ]);
    expect(tasks.every((x) => x.closed && x.mode === 'simulated')).toBe(true);
    const saved = savedTime(tasks);
    expect(saved.booked).toBe(3);
    expect(saved.totalSec).toBeGreaterThan(60 * 60); // over an hour of phone time
  });

  it('booked calls carry a real conversation; the unanswered one has none', () => {
    const calls = buildDemoCalls(TODAY);
    const eye = calls.find((x) => x.examId === 'eye_check')!;
    expect(eye.result).toMatchObject({ booked: true, time: '16:00' }); // fits "afternoons only"
    expect(eye.transcript.some((l) => l.text.startsWith('Niestety'))).toBe(true);
    const neuro = calls.find((x) => x.examId === 'neurolog')!;
    expect(neuro).toMatchObject({ status: 'failed', transcript: [], result: null });
  });

  it("keeps the user's own calls when the demo is loaded", () => {
    useCallTasksStore.getState().reset();
    useCallTasksStore
      .getState()
      .add(
        { id: 'mine', mode: 'live', profileId: 'own', examId: 'neurolog', facilityName: 'X' },
        1,
      );
    loadDemoPreset(TODAY);
    expect(useCallTasksStore.getState().tasks.some((x) => x.id === 'mine')).toBe(true);
  });
});
