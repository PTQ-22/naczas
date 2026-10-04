import { create } from 'zustand';

import { DEFAULT_PALETTE, type PaletteId } from './tokens';

interface PaletteState {
  palette: PaletteId;
  setPalette: (palette: PaletteId) => void;
}

// Not persisted on purpose: only a temporary switch for comparing palette candidates. Once the
// team picks one, the other palettes, this store and the Settings picker get deleted.
export const usePaletteStore = create<PaletteState>()((set) => ({
  palette: DEFAULT_PALETTE,
  setPalette: (palette) => set({ palette }),
}));
