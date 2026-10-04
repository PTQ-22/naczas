import { Linking, Platform, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useDefaultFacilityStore } from '@/store';
import { useTheme } from '@/theme';

import { mapsUrl, nfzTitleCase, telUrl } from './facility-format';

/** The user's default clinic with quick call / navigate / clear — or how to pick one. */
export function DefaultFacilityCard({ showTitle = true }: { showTitle?: boolean }) {
  const { space } = useTheme();
  const facility = useDefaultFacilityStore((s) => s.facility);
  const clear = useDefaultFacilityStore((s) => s.clear);
  const title = showTitle && (
    <Text variant="label" accessibilityRole="header">
      {t('facilities.defaultFacility.title')}
    </Text>
  );

  if (!facility) {
    return (
      <View style={{ gap: space.xs }} testID="default-facility-empty">
        {title}
        <Text variant="caption" tone="textMuted">
          {t('facilities.defaultFacility.none')}
        </Text>
      </View>
    );
  }

  const name = nfzTitleCase(facility.providerName);
  const tel = telUrl(facility.phone);
  return (
    <View style={{ gap: space.sm }} testID="default-facility">
      {title}
      <View accessible style={{ gap: space.xs / 2 }}>
        <Text variant="label">{name}</Text>
        <Text variant="caption" tone="textMuted">
          {`${nfzTitleCase(facility.address)}, ${nfzTitleCase(facility.locality)}`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
        {tel ? (
          <Button
            label={t('facilities.actions.call')}
            accessibilityLabel={t('facilities.actions.callA11y', { name })}
            accessibilityRole="link"
            icon="phone"
            onPress={() => void Linking.openURL(tel)}
          />
        ) : (
          <Text variant="caption" tone="textMuted">
            {t('facilities.defaultFacility.noPhone')}
          </Text>
        )}
        <Button
          label={t('facilities.actions.navigate')}
          accessibilityLabel={t('facilities.actions.navigateA11y', { name })}
          accessibilityRole="link"
          variant="ghost"
          icon="external"
          onPress={() => void Linking.openURL(mapsUrl(facility, Platform.OS))}
        />
        <Button
          label={t('facilities.defaultFacility.unset')}
          accessibilityLabel={t('facilities.defaultFacility.unsetA11y', { name })}
          variant="ghost"
          onPress={clear}
        />
      </View>
    </View>
  );
}
