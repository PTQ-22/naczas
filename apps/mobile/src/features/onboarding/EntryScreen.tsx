import { Redirect } from 'expo-router';

import { useProfilesStore, useStoresHydrated } from '@/store';
import { useSettingsStore } from '@/store/settings-store';

import { resolveEntryRoute } from './entry-route';

export default function EntryScreen() {
  const hydrated = useStoresHydrated();
  const profileCount = useProfilesStore((s) => s.profiles.length);
  const familyCode = useSettingsStore((s) => s.familyCode);
  const route = resolveEntryRoute({ hydrated, profileCount, familyCode });
  if (!route) return null;
  return <Redirect href={route} />;
}
