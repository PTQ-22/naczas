import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // WS1 DoD (AGENTS.md §4): ≥ 90% lines for the rules engine.
      thresholds: { lines: 90 },
    },
  },
});
