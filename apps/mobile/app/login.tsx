import { Redirect } from 'expo-router';

import { LoginModal } from '@/features/auth/LoginModal';
import { isSyncEnabled } from '@/services/feature-flags';

export default function LoginRoute() {
  // Deep link / stale history with sync off: leave, never show a login that cannot work.
  if (!isSyncEnabled()) return <Redirect href="/" />;
  return <LoginModal />;
}
