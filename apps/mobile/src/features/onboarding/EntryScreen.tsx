import { Redirect } from 'expo-router';

import { useProfilesStore, useStoresHydrated } from '@/store';

import { resolveEntryRoute } from './entry-route';

export default function EntryScreen() {
  const hydrated = useStoresHydrated();
  const profileCount = useProfilesStore((s) => s.profiles.length);
  const route = resolveEntryRoute({ hydrated, profileCount });
  if (!route) return null;
  return <Redirect href={route} />;
}
