import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import { useFonts } from 'expo-font';

import { fonts } from './tokens';

/** Only the six weights the type scale uses — keeps the web bundle and cold start small. */
export const fontAssets: Record<(typeof fonts)[keyof typeof fonts], number> = {
  [fonts.display]: BricolageGrotesque_800ExtraBold,
  [fonts.displayBold]: BricolageGrotesque_700Bold,
  [fonts.body]: AtkinsonHyperlegibleNext_400Regular,
  [fonts.bodyBold]: AtkinsonHyperlegibleNext_700Bold,
  [fonts.mono]: IBMPlexMono_500Medium,
  [fonts.monoBold]: IBMPlexMono_600SemiBold,
};

/**
 * Loads the app fonts (expo-font — works in Expo Go and on web). Returns true once ready or once
 * loading failed: a failed font must never block the app, it falls back to the system face.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(fontAssets);
  return loaded || error !== null;
}
