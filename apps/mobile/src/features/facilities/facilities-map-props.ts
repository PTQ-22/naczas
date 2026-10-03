import type { Facility } from '@naczas/shared';

/** Shared by FacilitiesMap.tsx (react-native-maps) and FacilitiesMap.web.tsx (react-leaflet). */
export interface FacilitiesMapProps {
  facilities: Facility[];
  /** User's area, already rounded to ~1 km. */
  origin?: { lat: number; lng: number };
  selectedId?: string;
  onSelect: (id: string) => void;
}
