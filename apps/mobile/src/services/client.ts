import { createHttpApi, type ApiClient } from './api';
import { createMockApi } from './api.mock';
import { createWaitTimesLoader } from './wait-times';

// Expo inlines EXPO_PUBLIC_* at build time — must be read as a literal `process.env.X`.
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === '1';

export const api: ApiClient = USE_MOCKS ? createMockApi() : createHttpApi();

/** App-wide, so the in-memory cache is shared by every screen. */
export const waitTimesLoader = createWaitTimesLoader({ api });
