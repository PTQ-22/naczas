import { resolveEntryRoute } from '../entry-route';

describe('resolveEntryRoute', () => {
  it('waits while persisted state is still loading', () => {
    expect(resolveEntryRoute({ hydrated: false, profileCount: 3, familyCode: null })).toBeNull();
  });

  it('sends first-time users to onboarding', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 0, familyCode: 'XYZ' })).toBe(
      '/onboarding/welcome',
    );
  });

  it('sends users without family code to onboarding if no profiles', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 0, familyCode: null })).toBe(
      '/onboarding/welcome',
    );
  });

  it('sends returning users to the plan', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 1, familyCode: 'XYZ' })).toBe('/plan');
  });
});
