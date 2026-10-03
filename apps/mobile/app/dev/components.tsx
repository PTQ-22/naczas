import { Redirect } from 'expo-router';

import { ComponentGallery } from '@/components/ComponentGallery';

// Dev-only route: production builds redirect away so the gallery never ships as a screen.
export default function DevComponentsRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ComponentGallery />;
}
