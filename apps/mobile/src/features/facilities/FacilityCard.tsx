import { Linking, Platform, View } from 'react-native';

import type { Facility } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import {
  accessibilityLabels,
  distanceLabel,
  facilityA11yLabel,
  mapsUrl,
  telUrl,
  waitLabel,
  waitTone,
} from './facility-format';

import type { FacilitiesSort } from './use-facilities';

interface FacilityCardProps {
  facility: Facility;
  /** First card in the list gets the screen's one filled primary CTA (screens.md §4). */
  primary?: boolean;
  sort: FacilitiesSort;
}

export function FacilityCard({ facility: f, primary = false, sort }: FacilityCardProps) {
  const { colors, seniorMode, space } = useTheme();
  const tel = telUrl(f.phone);
  const tone = waitTone(f.waitDays);
  const distance = distanceLabel(f.distanceKm);
  const access = accessibilityLabels(f.accessibility);
  // "Najbliżej" promotes distance to the front of the meta row; the wait stays in the chip.
  const meta = sort === 'nearest' ? [distance, ...access] : [...access, distance];

  return (
    <Card accent={colors.urgency[tone].accent}>
      {/* Info block is one screen-reader stop; the buttons below stay separately focusable. */}
      <View accessible accessibilityLabel={facilityA11yLabel(f)} style={{ gap: space.xs }}>
        <Chip label={waitLabel(f.waitDays)} tone={tone} dot />
        <Text variant="heading">{f.providerName}</Text>
        {!seniorMode && <Text tone="textMuted">{f.placeName}</Text>}
        <Text tone="textMuted">{`${f.address}, ${f.locality}`}</Text>
        <Text variant="caption" tone="textMuted" tabular>
          {meta.join(' · ')}
        </Text>
      </View>
      <View
        style={{
          flexDirection: seniorMode ? 'column' : 'row',
          flexWrap: 'wrap',
          alignItems: seniorMode ? 'stretch' : 'center',
          gap: space.sm,
        }}
      >
        {tel && (
          <Button
            label={t('facilities.actions.call')}
            accessibilityLabel={t('facilities.actions.callA11y', { name: f.providerName })}
            accessibilityRole="link"
            variant={primary ? 'primary' : 'secondary'}
            icon="phone"
            fullWidth={seniorMode}
            onPress={() => void Linking.openURL(tel)}
          />
        )}
        <Button
          label={t('facilities.actions.navigate')}
          accessibilityLabel={t('facilities.actions.navigateA11y', { name: f.providerName })}
          accessibilityRole="link"
          variant="ghost"
          icon="external"
          fullWidth={seniorMode}
          onPress={() => void Linking.openURL(mapsUrl(f, Platform.OS))}
        />
      </View>
    </Card>
  );
}
