export type EntryRoute = '/onboarding/welcome' | '/plan';

/**
 * Where app start should land. Returns null until persisted state is loaded —
 * redirecting earlier would bounce returning users through onboarding.
 */
export function resolveEntryRoute(state: {
  hydrated: boolean;
  profileCount: number;
}): EntryRoute | null {
  if (!state.hydrated) return null;
  return state.profileCount > 0 ? '/plan' : '/onboarding/welcome';
}
