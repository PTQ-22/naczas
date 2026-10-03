import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { mockProfileMama, rules } from '@naczas/rules';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { selectActiveProfile, useProfilesStore } from '@/store';
import { useTheme } from '@/theme';

import { FacilitiesMap } from './FacilitiesMap';
import { asOfLabel } from './facility-format';
import { FacilityCard } from './FacilityCard';
import { SegmentedControl } from './SegmentedControl';
import { useFacilities, type FacilitiesSort } from './use-facilities';

type ViewMode = 'list' | 'map';

function Skeleton() {
  const { colors, radius, space } = useTheme();
  return (
    <View accessibilityLabel={t('facilities.states.loading')} style={{ gap: space.md }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          testID="facility-skeleton"
          style={{ height: 160, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt }}
        />
      ))}
    </View>
  );
}

export default function FacilitiesScreen() {
  const { examId = '' } = useLocalSearchParams<{ examId: string }>();
  const { space } = useTheme();
  // TODO(WS3): drop the mock fallback once onboarding always creates an active profile.
  const profile = useProfilesStore(selectActiveProfile) ?? mockProfileMama;
  const location = profile.location;
  const rule = rules.find((r) => r.id === examId);

  const [sort, setSort] = useState<FacilitiesSort>('soonest');
  // Starts on the list (always in senior mode, screens.md §4); the list has everything the map has.
  // No side-by-side layout: Screen caps content at maxContentWidth (640).
  const [view, setView] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<string>();

  const query = useMemo(
    () =>
      location && rule?.booking === 'queue'
        ? {
            examId,
            province: location.province,
            lat: location.lat,
            lng: location.lng,
            sort,
          }
        : null,
    [examId, location, rule?.booking, sort],
  );
  const state = useFacilities(query);

  const header = (
    <View style={{ gap: space.xs }}>
      <Text variant="title" accessibilityRole="header">
        {rule ? t('facilities.heading', { exam: rule.name }) : t('facilities.headingFallback')}
      </Text>
      {state.status === 'success' && state.data.items.length > 0 && (
        <Text variant="caption" tone="textMuted">
          {t(`facilities.summary.${sort}`, {
            count: state.data.items.length,
            km: Math.ceil(Math.max(...state.data.items.map((f) => f.distanceKm))),
          })}
        </Text>
      )}
    </View>
  );

  if (!location || rule?.booking !== 'queue') {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        {header}
        <EmptyState
          icon="info"
          title={
            location ? t('facilities.states.noQueueTitle') : t('facilities.states.noLocationTitle')
          }
          body={location ? undefined : t('facilities.states.noLocationBody')}
        />
      </Screen>
    );
  }

  const controls = (
    <View style={{ gap: space.sm }}>
      <SegmentedControl
        label={t('facilities.sort.label')}
        value={sort}
        onChange={setSort}
        options={[
          { value: 'soonest', label: t('facilities.sort.soonest') },
          { value: 'nearest', label: t('facilities.sort.nearest') },
        ]}
      />
      <SegmentedControl
        label={t('facilities.view.label')}
        value={view}
        onChange={setView}
        options={[
          { value: 'list', label: t('facilities.view.list') },
          { value: 'map', label: t('facilities.view.map') },
        ]}
      />
    </View>
  );

  let body: ReactNode;
  if (state.status === 'loading') {
    body = <Skeleton />;
  } else if (state.status === 'error') {
    body = (
      <EmptyState
        icon="alert"
        title={t('facilities.states.errorTitle')}
        body={t('facilities.states.errorBody')}
        action={{ label: t('facilities.states.retry'), onPress: state.retry }}
      />
    );
  } else if (state.data.items.length === 0) {
    body = <EmptyState icon="info" title={t('facilities.states.emptyTitle')} />;
  } else {
    const { items, source } = state.data;
    const selected = items.find((f) => f.id === selectedId);
    const list = items.map((f, i) => (
      <FacilityCard key={f.id} facility={f} examId={examId} primary={i === 0} sort={sort} />
    ));
    const map = (
      <View style={{ gap: space.md }}>
        <View style={{ height: 420 }}>
          <FacilitiesMap
            facilities={items}
            origin={{ lat: location.lat, lng: location.lng }}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </View>
        {selected && <FacilityCard facility={selected} examId={examId} primary sort={sort} />}
      </View>
    );
    body = (
      <>
        {source === 'nfz_snapshot' && items[0] && (
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="info" size="sm" />
            <Text variant="caption" tone="textMuted" style={{ flex: 1 }}>
              {t('facilities.snapshotInfo', { date: asOfLabel(items[0].asOf) })}
            </Text>
          </Card>
        )}
        {view === 'map' ? map : list}
      </>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      {header}
      {controls}
      {body}
    </Screen>
  );
}
