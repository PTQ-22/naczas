import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';

import type { Facility } from '@naczas/shared';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { facilityKey, useDefaultFacilityStore } from '@/store';
import { fonts, useTheme } from '@/theme';

import {
  accessibilityLabels,
  displayPhone,
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
  /** First row gets the screen's one filled button, "Zadzwoń za mnie" (screens.md §4). */
  primary?: boolean;
  sort: FacilitiesSort;
}

/**
 * One facility as a row on the plate (redesign §4): weeks of waiting on the left in mono, like a
 * position on a departures board; distance under the wait figure; name and address on the right.
 * Actions: the phone number (tap to call), a map icon, "Zadzwoń za mnie" on the first row, and the
 * rest behind "⋯".
 */
export function FacilityRow({ facility: f, examId, primary = false }: FacilityRowProps) {
  const { colors, seniorMode, space, layout } = useTheme();
  const placeLine = distinctPlaceName(f.providerName, f.placeName);
  const tel = telUrl(f.phone);
  const phone = displayPhone(f.phone);
  const [moreOpen, setMoreOpen] = useState(false);
  const weeks = waitWeeks(f.waitDays);
  const tone = colors.urgency[waitTone(f.waitDays)].fg;
  const distance = distanceLabel(f.distanceKm);
  const access = accessibilityLabels(f.accessibility);
  const isDefault = useDefaultFacilityStore((s) => s.facility?.key === facilityKey(f));
  const setDefault = useDefaultFacilityStore((s) => s.setDefault);
  const clearDefault = useDefaultFacilityStore((s) => s.clear);
  // Distance lives under the wait figure (never wraps); amenities stay a quiet text line.

  return (
    <View style={{ flexDirection: 'row', gap: space.md, paddingVertical: space.md }}>
      <View
        // Wait and distance are already in the info block's label below.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ minWidth: layout.minTouch + space.md, alignItems: 'flex-start' }}
      >
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
        <Text variant="caption" tone="textMuted" numberOfLines={1} style={{ marginTop: space.xs }}>
          {distance}
        </Text>
      </View>
      {/* Actions sit in the text column, so they line up with the name and address. */}
      <View style={{ flex: 1, gap: space.sm }}>
        {/* Info block is one screen-reader stop; the buttons stay separately focusable. */}
        <View accessible accessibilityLabel={facilityA11yLabel(f)} style={{ gap: space.xs / 2 }}>
          {isDefault && (
            <Text variant="caption" tone="primary" testID="default-facility-badge">
              {t('facilities.defaultFacility.badge')}
            </Text>
          )}
          <Text variant="label">{nfzTitleCase(f.providerName)}</Text>
          {!seniorMode && placeLine && (
            <Text variant="caption" tone="textMuted">
              {placeLine}
            </Text>
          )}
          <Text variant="caption" tone="textMuted">
            {`${nfzTitleCase(f.address)}, ${nfzTitleCase(f.locality)}`}
          </Text>
          {f.anesthesia === true && (
            <Text variant="caption" tone="textMuted">
              {t('facilities.anesthesia')}
            </Text>
          )}
          {access.length > 0 && (
            <Text variant="caption" tone="textMuted">
              {access.join(' · ')}
            </Text>
          )}
        </View>
        {/* The number itself is the call button, so people see what they are dialling. */}
        {tel && phone && (
          // Ghost padding would indent the number; pull it back to the text edge.
          <View
            style={seniorMode ? undefined : { marginLeft: -space.sm, alignItems: 'flex-start' }}
          >
            <Button
              label={phone}
              accessibilityLabel={t('facilities.actions.callA11y', { name: f.providerName })}
              accessibilityRole="link"
              variant={seniorMode ? 'secondary' : 'ghost'}
              icon="phone"
              fullWidth={seniorMode}
              onPress={() => void Linking.openURL(tel)}
            />
          </View>
        )}
        {/* Every facility can be called by the AI agent; only the first gets the filled button
            (one primary per screen, tokens.md §6.3). */}
        <Button
          label={t('facilities.actions.callForMe')}
          accessibilityLabel={t('facilities.actions.callForMeA11y', { name: f.providerName })}
          variant={primary ? 'primary' : 'secondary'}
          icon="phone"
          fullWidth={seniorMode}
          onPress={() =>
            router.push({
              pathname: '/exam/[examId]/call',
              params: {
                examId,
                facility: nfzTitleCase(f.providerName),
                // Lets the availability calendar open on the day the clinic can take the patient.
                ...(f.firstAvailableDate && { firstDate: f.firstAvailableDate }),
              },
            })
          }
        />
        {/* Less frequent actions behind "⋯", inline rather than a native sheet (works on web too). */}
        {moreOpen && (
          <View style={{ alignItems: seniorMode ? 'stretch' : 'flex-start', gap: space.xs }}>
            <Button
              label={t(
                isDefault ? 'facilities.defaultFacility.unset' : 'facilities.defaultFacility.set',
              )}
              accessibilityLabel={t(
                isDefault
                  ? 'facilities.defaultFacility.unsetA11y'
                  : 'facilities.defaultFacility.setA11y',
                { name: f.providerName },
              )}
              variant="ghost"
              icon="star"
              fullWidth={seniorMode}
              onPress={() => (isDefault ? clearDefault() : setDefault(f))}
            />
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
        )}
      </View>
      {/* Quiet icons on the right: navigate, and "⋯" for the less frequent actions. */}
      <View style={{ gap: space.xs }}>
        <IconButton
          icon="map"
          accessibilityRole="link"
          accessibilityLabel={t('facilities.actions.navigateA11y', { name: f.providerName })}
          onPress={() => void Linking.openURL(mapsUrl(f, Platform.OS))}
        />
        <IconButton
          icon="more"
          accessibilityLabel={t('facilities.actions.more', { name: f.providerName })}
          expanded={moreOpen}
          onPress={() => setMoreOpen((open) => !open)}
        />
      </View>
    </View>
  );
}
