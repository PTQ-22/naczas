import { createContext } from 'react';

/**
 * True when a component renders straight on the cobalt tile wall (e.g. a floating footer CTA)
 * rather than on a cream plate. Buttons invert their colours there, or cobalt-on-cobalt vanishes.
 */
export const OnWallContext = createContext(false);
