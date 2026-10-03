import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { facilityA11yLabel, waitTone, waitWeeks } from './facility-format';

import type { FacilitiesMapProps } from './facilities-map-props';

// Roughly a 25 km window around the user; markers outside are still reachable by panning.
const DELTA = 0.35;

export function FacilitiesMap({ facilities, origin, selectedId, onSelect }: FacilitiesMapProps) {
  const { colors, layout, radius, borderWidth, space } = useTheme();
  const center = origin ?? facilities[0] ?? { lat: 52.23, lng: 21.01 };

  return (
    <MapView
      accessibilityLabel={t('facilities.map.a11y')}
      style={{ flex: 1, minHeight: 320, borderRadius: radius.lg }}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }}
    >
      {origin && (
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          title={t('facilities.map.you')}
          pinColor={colors.primary}
        />
      )}
      {facilities.map((f) => {
        const palette = colors.urgency[waitTone(f.waitDays)];
        const selected = f.id === selectedId;
        return (
          <Marker
            key={f.id}
            coordinate={{ latitude: f.lat, longitude: f.lng }}
            accessibilityLabel={facilityA11yLabel(f)}
            onPress={() => onSelect(f.id)}
          >
            <View
              style={{
                minWidth: layout.icon.lg + space.sm,
                height: layout.icon.lg + space.sm,
                paddingHorizontal: space.xs,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.accent,
                borderWidth: selected ? borderWidth.focus : borderWidth.strong,
                borderColor: selected ? colors.text : colors.surface,
              }}
            >
              <Text variant="label" color={colors.surface}>
                {String(waitWeeks(f.waitDays) ?? '?')}
              </Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}
