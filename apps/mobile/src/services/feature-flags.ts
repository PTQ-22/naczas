/**
 * Konto Rodzinne (login + cloud sync of profiles) is opt-in at build time. Off by default:
 * the demo build keeps health data on the phone only (AGENTS.md §8), so nothing may call
 * /v1/auth or /v1/sync and no login UI is shown unless EXPO_PUBLIC_ENABLE_SYNC=1.
 *
 * A function, not a constant, so tests can flip the env per case. Expo still inlines it:
 * the env is read as a literal `process.env.EXPO_PUBLIC_*` (see client.ts).
 */
export function isSyncEnabled(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_SYNC === '1';
}
