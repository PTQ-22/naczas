import * as Location from 'expo-location';

import { roundCoord } from './api';
import { provinceForCoords, type ProvincePoint } from './postal';

export type GpsResult =
  { ok: true; point: ProvincePoint } | { ok: false; reason: 'denied' | 'error' };

/**
 * Asks for foreground permission (only when the user taps "Use my location") and resolves the
 * province. Coordinates are rounded right away — nothing more precise is ever stored.
 */
export async function locateWithGps(): Promise<GpsResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return { ok: false, reason: 'denied' };
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const lat = roundCoord(position.coords.latitude);
    const lng = roundCoord(position.coords.longitude);
    return { ok: true, point: { province: provinceForCoords(lat, lng), lat, lng } };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
