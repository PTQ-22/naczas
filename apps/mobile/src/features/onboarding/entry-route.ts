export type EntryRoute = '/onboarding/login' | '/onboarding/welcome' | '/(tabs)/agent';

/**
 * Where app start should land. Returns null until persisted state is loaded —
 * redirecting earlier would bounce returning users through onboarding.
 */
export function resolveEntryRoute(state: {
  hydrated: boolean;
  profileCount: number;
  familyCode: string | null;
  /** isSyncEnabled(): without sync a family code brings no profiles, so it can't skip onboarding. */
  syncEnabled: boolean;
}): EntryRoute | null {
  if (!state.hydrated) return null;
  if (state.profileCount > 0 || (state.syncEnabled && state.familyCode)) return '/(tabs)/agent';
  return '/onboarding/welcome';
}
