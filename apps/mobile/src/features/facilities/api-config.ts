const DEFAULT_API_URL = 'http://localhost:8787';

export interface ApiConfig {
  baseUrl: string;
  useMocks: boolean;
}

/**
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so tests can't change them at
 * runtime — they mock this module instead.
 * TODO(WS3): move to src/services together with fetchFacilities.
 */
export function apiConfig(): ApiConfig {
  return {
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
    useMocks: process.env.EXPO_PUBLIC_USE_MOCKS === '1',
  };
}
