import { Redirect } from 'expo-router';

import { resolveEntryRoute } from './entry-route';

export default function EntryScreen() {
  // TODO(WS3-2): read `hydrated` and profile count from the profiles store.
  const route = resolveEntryRoute({ hydrated: true, profileCount: 0 });
  if (!route) return null;
  return <Redirect href={route} />;
}
