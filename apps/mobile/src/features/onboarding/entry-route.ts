export type EntryRoute = '/onboarding/login' | '/onboarding/welcome' | '/(tabs)/agent';

/**
 * Where app start should land. Returns null until persisted state is loaded —
 * redirecting earlier would bounce returning users through onboarding.
 */
export function resolveEntryRoute(state: {
  hydrated: boolean;
  profileCount: number;
  familyCode: string | null;
}): EntryRoute | null {
  if (!state.hydrated) return null;
  if (state.profileCount > 0 || state.familyCode) return '/(tabs)/agent';
  return '/onboarding/welcome';
}
