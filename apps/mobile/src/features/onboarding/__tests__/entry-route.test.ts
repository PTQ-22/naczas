import { resolveEntryRoute } from '../entry-route';

describe('resolveEntryRoute', () => {
  it('waits while persisted state is still loading', () => {
    expect(
      resolveEntryRoute({ hydrated: false, profileCount: 3, familyCode: null, syncEnabled: true }),
    ).toBeNull();
  });

  // 880e4de: a signed-in family account skips onboarding — its profiles arrive via cloud sync.
  it('sync on: sends signed-in family accounts to the agent home before profiles sync', () => {
    expect(
      resolveEntryRoute({ hydrated: true, profileCount: 0, familyCode: 'XYZ', syncEnabled: true }),
    ).toBe('/(tabs)/agent');
  });

  // Demo build: no sync, so a code left by an older build would land on an empty plan.
  it('sync off: ignores a stored family code and starts onboarding', () => {
    expect(
      resolveEntryRoute({ hydrated: true, profileCount: 0, familyCode: 'XYZ', syncEnabled: false }),
    ).toBe('/onboarding/welcome');
  });

  it('sends users without family code to onboarding if no profiles', () => {
    expect(
      resolveEntryRoute({ hydrated: true, profileCount: 0, familyCode: null, syncEnabled: true }),
    ).toBe('/onboarding/welcome');
  });

  it('sends returning users to the agent home', () => {
    expect(
      resolveEntryRoute({ hydrated: true, profileCount: 1, familyCode: 'XYZ', syncEnabled: true }),
    ).toBe('/(tabs)/agent');
    expect(
      resolveEntryRoute({ hydrated: true, profileCount: 1, familyCode: null, syncEnabled: false }),
    ).toBe('/(tabs)/agent');
  });
});
