import 'leaflet/dist/leaflet.css';

import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { escapeMarkerText, facilityA11yLabel, waitTone, waitWeeks } from './facility-format';

import type { FacilitiesMapProps } from './facilities-map-props';

interface LeafletModules {
  L: typeof import('leaflet');
  RL: typeof import('react-leaflet');
}

const ZOOM = 10;
const MARKER_PX = 30;
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function FacilitiesMap({ facilities, origin, selectedId, onSelect }: FacilitiesMapProps) {
  const { colors, radius, type } = useTheme();
  // Leaflet touches `window` on import and web output is "static" (server-rendered),
  // so both modules are loaded only in the browser.
  const [mods, setMods] = useState<LeafletModules | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.all([import('leaflet'), import('react-leaflet')]).then(([L, RL]) => {
      if (alive) setMods({ L, RL });
    });
    return () => {
      alive = false;
    };
  }, []);

  const center = origin ?? facilities[0] ?? { lat: 52.23, lng: 21.01 };

  if (!mods) {
    return (
      <View style={{ flex: 1, minHeight: 320, borderRadius: radius.lg }}>
        <Text tone="textMuted">{t('facilities.states.loading')}</Text>
      </View>
    );
  }
  const { L, RL } = mods;
  const { MapContainer, TileLayer, Marker, CircleMarker, Tooltip } = RL;

  const icon = (label: string, fill: string, selected: boolean) =>
    L.divIcon({
      className: '',
      iconSize: [MARKER_PX, MARKER_PX],
      iconAnchor: [MARKER_PX / 2, MARKER_PX / 2],
      html: `<div style="width:${MARKER_PX}px;height:${MARKER_PX}px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;background:${fill};
        border:${selected ? 3 : 2}px solid ${selected ? colors.text : colors.surface};
        color:${colors.surface};font:600 ${type.caption.fontSize}px system-ui,sans-serif">
        ${escapeMarkerText(label)}</div>`,
    });

  return (
    <View
      accessibilityLabel={t('facilities.map.a11y')}
      style={{ flex: 1, minHeight: 320, borderRadius: radius.lg, overflow: 'hidden' }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={ZOOM}
        style={{ height: '100%', minHeight: 320, width: '100%' }}
      >
        <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
        {origin && (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={8}
            pathOptions={{ color: colors.primary, fillColor: colors.primary, fillOpacity: 0.4 }}
          >
            <Tooltip>{t('facilities.map.you')}</Tooltip>
          </CircleMarker>
        )}
        {facilities.map((f) => {
          const label = facilityA11yLabel(f);
          return (
            <Marker
              key={f.id}
              position={[f.lat, f.lng]}
              // Leaflet markers are keyboard-focusable; `title` is what screen readers announce.
              title={label}
              icon={icon(
                String(waitWeeks(f.waitDays) ?? '?'),
                colors.urgency[waitTone(f.waitDays)].accent,
                f.id === selectedId,
              )}
              eventHandlers={{ click: () => onSelect(f.id), keypress: () => onSelect(f.id) }}
            >
              <Tooltip direction="top" offset={[0, -MARKER_PX / 2]}>
                {label}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}
