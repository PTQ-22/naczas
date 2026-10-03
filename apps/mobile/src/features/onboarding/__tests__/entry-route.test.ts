import { resolveEntryRoute } from '../entry-route';

describe('resolveEntryRoute', () => {
  it('waits while persisted state is still loading', () => {
    expect(resolveEntryRoute({ hydrated: false, profileCount: 3 })).toBeNull();
  });

  it('sends first-time users to onboarding', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 0 })).toBe('/onboarding/welcome');
  });

  it('sends returning users to the plan', () => {
    expect(resolveEntryRoute({ hydrated: true, profileCount: 1 })).toBe('/plan');
  });
});
