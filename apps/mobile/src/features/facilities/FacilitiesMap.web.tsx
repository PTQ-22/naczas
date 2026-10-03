import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { escapeMarkerText, facilityA11yLabel, waitTone, waitWeeks } from './facility-format';
import { boundsOf, spreadOverlapping } from './map-layout';

import type { FacilitiesMapProps } from './facilities-map-props';
import type { Map as LeafletMap } from 'leaflet';

interface LeafletModules {
  L: typeof import('leaflet');
  RL: typeof import('react-leaflet');
}

const ZOOM = 10;
const MAX_FIT_ZOOM = 15;
const FIT_PADDING_PX = 32;
const MARKER_PX = 30;
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function FacilitiesMap({ facilities, origin, selectedId, onSelect }: FacilitiesMapProps) {
  const { colors, radius, type } = useTheme();
  // Leaflet touches `window` on import, so both modules load only after mount. Web output is
  // 'single' (SPA) today; this also keeps the map safe if it goes back to static rendering.
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

  const points = useMemo(() => spreadOverlapping(facilities), [facilities]);
  const bounds = useMemo(
    () => boundsOf([...points, ...(origin ? [origin] : [])]),
    [points, origin],
  );
  const center = origin ?? points[0] ?? { lat: 52.23, lng: 21.01 };

  // Every marker and the user's area in view (M3 report: far facilities were cut off).
  // Re-fits when the covered area changes, e.g. after a reload.
  const [map, setMap] = useState<LeafletMap | null>(null);
  useEffect(() => {
    if (!map || !bounds) return;
    map.fitBounds(
      [
        [bounds.sw.lat, bounds.sw.lng],
        [bounds.ne.lat, bounds.ne.lng],
      ],
      { padding: [FIT_PADDING_PX, FIT_PADDING_PX], maxZoom: MAX_FIT_ZOOM },
    );
  }, [map, bounds]);

  if (!mods) {
    return (
      <View style={{ flex: 1, minHeight: 320, borderRadius: radius.lg }}>
        <Text tone="textMuted">{t('facilities.states.loading')}</Text>
      </View>
    );
  }
  const { L, RL } = mods;
  const { MapContainer, TileLayer, Marker, Tooltip } = RL;

  const icon = (label: string, fill: string, selected: boolean) =>
    L.divIcon({
      className: '',
      iconSize: [MARKER_PX, MARKER_PX],
      iconAnchor: [MARKER_PX / 2, MARKER_PX / 2],
      html: `<div style="min-width:${MARKER_PX}px;height:${MARKER_PX}px;border-radius:${MARKER_PX}px;
        box-sizing:border-box;padding:0 4px;display:flex;align-items:center;justify-content:center;
        background:${fill};border:${selected ? 3 : 2}px solid ${selected ? colors.text : colors.surface};
        color:${colors.surface};font:600 ${type.caption.fontSize}px system-ui,sans-serif">
        ${escapeMarkerText(label)}</div>`,
    });

  return (
    <View
      accessibilityLabel={t('facilities.map.a11y')}
      style={{ flex: 1, minHeight: 320, borderRadius: radius.lg, overflow: 'hidden' }}
    >
      <MapContainer
        ref={setMap}
        center={[center.lat, center.lng]}
        zoom={ZOOM}
        style={{ height: '100%', minHeight: 320, width: '100%' }}
      >
        <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
        {origin && (
          <Marker
            position={[origin.lat, origin.lng]}
            title={t('facilities.map.you')}
            icon={icon(t('facilities.map.youShort'), colors.primary, false)}
            // Above facilities so the user's reference point is never hidden; below the selection.
            zIndexOffset={500}
          >
            <Tooltip direction="top" offset={[0, -MARKER_PX / 2]}>
              {t('facilities.map.you')}
            </Tooltip>
          </Marker>
        )}
        {facilities.map((f) => {
          const p = points.find((x) => x.id === f.id) ?? f;
          const label = facilityA11yLabel(f);
          const selected = f.id === selectedId;
          return (
            <Marker
              key={f.id}
              position={[p.lat, p.lng]}
              // Leaflet markers are keyboard-focusable; `title` is what screen readers announce.
              title={label}
              icon={icon(
                String(waitWeeks(f.waitDays) ?? '?'),
                colors.urgency[waitTone(f.waitDays)].accent,
                selected,
              )}
              zIndexOffset={selected ? 1000 : 0}
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
