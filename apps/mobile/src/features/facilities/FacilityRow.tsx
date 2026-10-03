import { router } from 'expo-router';
import { Linking, Platform, View } from 'react-native';

import type { Facility } from '@naczas/shared';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { fonts, useTheme } from '@/theme';

import {
  accessibilityLabels,
  distanceLabel,
  distinctPlaceName,
  facilityA11yLabel,
  mapsUrl,
  nfzTitleCase,
  telUrl,
  waitTone,
  waitWeeks,
} from './facility-format';

import type { FacilitiesSort } from './use-facilities';

interface FacilityRowProps {
  facility: Facility;
  examId: string;
  /** First row gets the screen's one filled call button (screens.md §4). */
  primary?: boolean;
  sort: FacilitiesSort;
}

/**
 * One facility as a row on the plate (redesign §4): weeks of waiting on the left in mono, like a
 * position on a departures board; distance under the wait figure; name and address on the right; a 44 pt call button.
 */
export function FacilityRow({ facility: f, examId, primary = false }: FacilityRowProps) {
  const { colors, seniorMode, space, layout } = useTheme();
  const placeLine = distinctPlaceName(f.providerName, f.placeName);
  const tel = telUrl(f.phone);
  const weeks = waitWeeks(f.waitDays);
  const tone = colors.urgency[waitTone(f.waitDays)].fg;
  const distance = distanceLabel(f.distanceKm);
  const access = accessibilityLabels(f.accessibility);
  // Distance lives under the wait figure (never wraps); amenities stay a quiet text line.

  return (
    <View style={{ gap: space.sm, paddingVertical: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
        {/* Info block is one screen-reader stop; the buttons stay separately focusable. */}
        <View
          accessible
          accessibilityLabel={facilityA11yLabel(f)}
          style={{ flex: 1, flexDirection: 'row', gap: space.md }}
        >
          <View style={{ minWidth: layout.minTouch + space.md, alignItems: 'flex-start' }}>
            <Text
              variant="title"
              tabular
              color={tone}
              style={{ fontFamily: fonts.monoBold, letterSpacing: 0 }}
            >
              {weeks ?? '—'}
            </Text>
            <Text variant="eyebrow" tone="textMuted">
              {t('facilities.wait.unit')}
            </Text>
            <Text
              variant="caption"
              tone="textMuted"
              numberOfLines={1}
              style={{ marginTop: space.xs }}
            >
              {distance}
            </Text>
          </View>
          <View style={{ flex: 1, gap: space.xs / 2 }}>
            <Text variant="label">{nfzTitleCase(f.providerName)}</Text>
            {!seniorMode && placeLine && (
              <Text variant="caption" tone="textMuted">
                {placeLine}
              </Text>
            )}
            <Text variant="caption" tone="textMuted">
              {`${nfzTitleCase(f.address)}, ${nfzTitleCase(f.locality)}`}
            </Text>
            {access.length > 0 && (
              <Text variant="caption" tone="textMuted">
                {access.join(' · ')}
              </Text>
            )}
          </View>
        </View>
        {tel && !seniorMode && (
          <IconButton
            icon="phone"
            filled={primary}
            accessibilityRole="link"
            accessibilityLabel={t('facilities.actions.callA11y', { name: f.providerName })}
            onPress={() => void Linking.openURL(tel)}
          />
        )}
      </View>
      <View
        style={{
          flexDirection: seniorMode ? 'column' : 'row',
          flexWrap: seniorMode ? 'nowrap' : 'wrap',
          alignItems: seniorMode ? 'stretch' : 'center',
          gap: space.xs,
        }}
      >
        {/* Senior mode: a labelled full-width call button instead of the bare icon. */}
        {tel && seniorMode && (
          <Button
            label={t('facilities.actions.call')}
            accessibilityLabel={t('facilities.actions.callA11y', { name: f.providerName })}
            accessibilityRole="link"
            variant={primary ? 'primary' : 'secondary'}
            icon="phone"
            fullWidth
            onPress={() => void Linking.openURL(tel)}
          />
        )}
        {/* Demo: an AI voice agent phones for the visit — only on the best facility. */}
        {primary && (
          <Button
            label={t('facilities.actions.callForMe')}
            accessibilityLabel={t('facilities.actions.callForMeA11y', { name: f.providerName })}
            variant="secondary"
            icon="phone"
            fullWidth={seniorMode}
            onPress={() =>
              router.push({
                pathname: '/exam/[examId]/call',
                params: { examId, facility: nfzTitleCase(f.providerName) },
              })
            }
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
        {/* After calling, the user records the visit; the facility name is shown as context. */}
        <Button
          label={t('facilities.actions.booked')}
          accessibilityLabel={t('facilities.actions.bookedA11y', { name: f.providerName })}
          variant="ghost"
          icon="booked"
          fullWidth={seniorMode}
          onPress={() =>
            router.push({
              pathname: '/exam/[examId]/book',
              params: { examId, facility: f.providerName },
            })
          }
        />
      </View>
    </View>
  );
}
