import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { facilityA11yLabel, waitTone, waitWeeks } from './facility-format';
import { spreadOverlapping } from './map-layout';

import type { FacilitiesMapProps } from './facilities-map-props';

// Fallback window before fitToCoordinates runs (or with a single point).
const DELTA = 0.35;
const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

export function FacilitiesMap({ facilities, origin, selectedId, onSelect }: FacilitiesMapProps) {
  const { colors, layout, radius, borderWidth, space } = useTheme();
  const mapRef = useRef<MapView>(null);
  const points = useMemo(() => spreadOverlapping(facilities), [facilities]);
  const center = origin ?? points[0] ?? { lat: 52.23, lng: 21.01 };

  // Every marker and the user's area in view (M3 report: far facilities were cut off).
  const coordinates = useMemo(
    () =>
      [...points, ...(origin ? [origin] : [])].map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      })),
    [points, origin],
  );
  const fit = () => {
    if (coordinates.length > 1) {
      mapRef.current?.fitToCoordinates(coordinates, { edgePadding: EDGE_PADDING, animated: false });
    }
  };
  // Re-fit when the data changes (sort, reload); the first fit happens in onMapReady.
  useEffect(() => {
    if (coordinates.length > 1) {
      mapRef.current?.fitToCoordinates(coordinates, { edgePadding: EDGE_PADDING, animated: false });
    }
  }, [coordinates]);

  const bubble = (label: string, fill: string, selected: boolean) => (
    <View
      style={{
        minWidth: layout.icon.lg + space.sm,
        height: layout.icon.lg + space.sm,
        paddingHorizontal: space.xs,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: fill,
        borderWidth: selected ? borderWidth.focus : borderWidth.strong,
        borderColor: selected ? colors.text : colors.surface,
      }}
    >
      <Text variant="label" color={colors.surface}>
        {label}
      </Text>
    </View>
  );

  return (
    <MapView
      ref={mapRef}
      accessibilityLabel={t('facilities.map.a11y')}
      // Low floor: the doctors tab shows a compact map; it re-fits whenever its size changes.
      style={{ flex: 1, minHeight: 160, borderRadius: radius.lg }}
      onLayout={fit}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }}
      onMapReady={fit}
    >
      {origin && (
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          accessibilityLabel={t('facilities.map.you')}
          // Above facilities so the user's reference point is never hidden; below the selection.
          zIndex={2}
        >
          {bubble(t('facilities.map.youShort'), colors.primary, false)}
        </Marker>
      )}
      {facilities.map((f) => {
        const p = points.find((x) => x.id === f.id) ?? f;
        const selected = f.id === selectedId;
        return (
          <Marker
            key={f.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            accessibilityLabel={facilityA11yLabel(f)}
            zIndex={selected ? 3 : 1}
            onPress={() => onSelect(f.id)}
          >
            {bubble(
              String(waitWeeks(f.waitDays) ?? '?'),
              colors.urgency[waitTone(f.waitDays)].accent,
              selected,
            )}
          </Marker>
        );
      })}
    </MapView>
  );
}
