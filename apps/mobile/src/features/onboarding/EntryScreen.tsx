import { Redirect } from 'expo-router';

// WS3: redirect to /plan when at least one profile exists.
export default function EntryScreen() {
  return <Redirect href="/onboarding/welcome" />;
}
