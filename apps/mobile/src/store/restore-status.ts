import { create } from 'zustand';

interface RestoreStatusState {
  /** Names of persisted stores whose saved data was unreadable and got reset to defaults. */
  failedStores: string[];
  reportFailure: (storeName: string) => void;
  dismiss: () => void;
}

/** In-memory only — drives the "couldn't read saved data" notice after a reset. */
export const useRestoreStatus = create<RestoreStatusState>()((set) => ({
  failedStores: [],
  reportFailure: (storeName) =>
    set((s) =>
      s.failedStores.includes(storeName) ? s : { failedStores: [...s.failedStores, storeName] },
    ),
  dismiss: () => set({ failedStores: [] }),
}));
