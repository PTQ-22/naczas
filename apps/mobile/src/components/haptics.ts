import * as Haptics from 'expo-haptics';

/**
 * Success tap for "Oznacz jako zrobione" / saving a visit (redesign §5). iOS only: Android
 * vibration is coarse and web has none. Fire-and-forget — a missing engine must not throw.
 */
export function successHaptic(): void {
  if (process.env.EXPO_OS !== 'ios') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
