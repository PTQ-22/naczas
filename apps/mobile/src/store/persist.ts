import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRestoreStatus } from './restore-status';

import type { z } from 'zod';
import type { PersistOptions, PersistStorage, StorageValue } from 'zustand/middleware';

/** Step `n` upgrades persisted state from version `n` to `n + 1`. */
export type Migrations = Record<number, (state: unknown) => unknown>;

export const STORAGE_PREFIX = 'naczas:';

export function runMigrations(
  state: unknown,
  fromVersion: number,
  toVersion: number,
  migrations: Migrations,
): unknown {
  if (fromVersion > toVersion) {
    throw new Error(`Stored version ${fromVersion} is newer than app version ${toVersion}`);
  }
  let result = state;
  for (let v = fromVersion; v < toVersion; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`Missing migration from version ${v}`);
    result = step(result);
  }
  return result;
}

function resetCorrupted(name: string) {
  useRestoreStatus.getState().reportFailure(name);
  void AsyncStorage.removeItem(name);
}

/**
 * JSON storage that never throws. zustand's persist leaves `hasHydrated()` false forever when
 * hydration rejects, which would freeze the app on the entry redirect — so unreadable data is
 * reported and dropped here instead.
 */
function safeJsonStorage<P>(): PersistStorage<P> {
  return {
    getItem: async (name) => {
      const raw = await AsyncStorage.getItem(name);
      if (raw === null) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && 'state' in parsed) {
          return parsed as StorageValue<P>;
        }
      } catch {
        // fall through to reset
      }
      resetCorrupted(name);
      return null;
    },
    setItem: (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
    removeItem: (name) => AsyncStorage.removeItem(name),
  };
}

/**
 * Shared persist config: AsyncStorage, versioned migrations, and Zod validation of whatever
 * comes back from disk (AGENTS.md §3 — storage is an external boundary).
 */
export function validatedPersist<S, P>(options: {
  name: string;
  version: number;
  schema: z.ZodType<P>;
  partialize: (state: S) => P;
  migrations?: Migrations;
}): PersistOptions<S, P> {
  const name = STORAGE_PREFIX + options.name;
  return {
    name,
    version: options.version,
    storage: safeJsonStorage<P>(),
    partialize: options.partialize,
    migrate: (persisted, fromVersion) => {
      try {
        return runMigrations(
          persisted,
          fromVersion,
          options.version,
          options.migrations ?? {},
        ) as P;
      } catch {
        // Returning undefined makes merge() fall back to defaults instead of rejecting hydration.
        resetCorrupted(name);
        return undefined as P;
      }
    },
    // Runs after migrate — validating here covers both current-version and migrated data.
    merge: (persisted, current) => {
      if (persisted === undefined) return current;
      const result = options.schema.safeParse(persisted);
      if (!result.success) {
        resetCorrupted(name);
        return current;
      }
      return { ...current, ...result.data };
    },
  };
}
