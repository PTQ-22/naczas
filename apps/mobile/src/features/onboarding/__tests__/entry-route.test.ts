import { resolveEntryRoute } from '../entry-route';

describe('resolveEntryRoute', () => {
  it('waits while persisted state is still loading', () => {
    expect(resolveEntryRoute({ hydrated: false, profileCount: 3, familyCode: null })).toBeNull();
  });

  // 880e4de: a signed-in family account skips onboarding — its profiles arrive via cloud sync.
  it('sends signed-in family accounts to the agent home before profiles sync', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 0, familyCode: 'XYZ' })).toBe(
      '/(tabs)/agent',
    );
  });

  it('sends users without family code to onboarding if no profiles', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 0, familyCode: null })).toBe(
      '/onboarding/welcome',
    );
  });

  it('sends returning users to the agent home', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 1, familyCode: 'XYZ' })).toBe(
      '/(tabs)/agent',
    );
  });
});
