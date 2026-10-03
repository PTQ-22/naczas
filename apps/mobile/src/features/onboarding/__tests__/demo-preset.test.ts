import { computePlan } from '@naczas/rules';
import { ExamRecordSchema, ProfileSchema } from '@naczas/shared';

import { recordsForProfile, resetAllData, useProfilesStore, useRecordsStore } from '@/store';
import { makeProfile } from '@/store/__fixtures__/fixtures';

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
      ['Mama', 58, 'Warszawa, woj. mazowieckie'],
      ['Kasia', 34, 'Warszawa, woj. mazowieckie'],
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

  it('makes cervical screening urgent for Kasia', () => {
    const urgency = Object.fromEntries(
      planFor(DEMO_KASIA_ID).items.map((i) => [i.examId, i.urgency]),
    );
    expect(urgency.cervical_screening).toBe('act_now');
    expect(urgency.dental_checkup).not.toBe('act_now');
  });
});

describe('loadDemoPreset', () => {
  it('adds both profiles with records and activates Mama', () => {
    loadDemoPreset(TODAY);
    const { profiles, activeProfileId } = useProfilesStore.getState();
    expect(profiles.map((p) => p.id)).toEqual([DEMO_MAMA_ID, DEMO_KASIA_ID]);
    expect(activeProfileId).toBe(DEMO_MAMA_ID);
    expect(recordsForProfile(useRecordsStore.getState().records, DEMO_KASIA_ID)).toHaveLength(2);
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
