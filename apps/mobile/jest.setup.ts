// Global test setup (jest.config.js → setupFiles).
// AsyncStorage has no native module under Jest; every persisted zustand store imports it, so any
// test touching '@/store' needs this mock. Per-file mocks of the same module still work (and
// still win) — they are just no longer required in new tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
