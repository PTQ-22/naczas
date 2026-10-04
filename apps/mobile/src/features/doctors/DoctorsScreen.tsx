import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { mockProfileMama } from '@naczas/rules';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { DefaultFacilityCard } from '@/features/facilities/DefaultFacilityCard';
import { FacilitiesMap } from '@/features/facilities/FacilitiesMap';
import { FacilityRow } from '@/features/facilities/FacilityRow';
import { FacilityRows } from '@/features/facilities/FacilityRows';
import { FacilitySkeleton } from '@/features/facilities/FacilitySkeleton';
import { useFacilities, type FacilitiesSort } from '@/features/facilities/use-facilities';
import { t } from '@/i18n';
import {
  pinDefaultFirst,
  selectActiveProfile,
  useDefaultFacilityStore,
  useProfilesStore,
} from '@/store';
import { useTheme } from '@/theme';

import {
  defaultFacilityFilters,
  filterFacilities,
  type FacilityFeature,
  type MaxDistance,
} from './filter-facilities';
import { FiltersButton } from './FiltersButton';
import { FiltersSheet } from './FiltersSheet';
import { SPECIALTY_EXAM_IDS, type SpecialtyExamId } from './specialties';

/** API max — filters run on the client, so give them as much as the API allows. */
const LIMIT = 50;
const MAP_HEIGHT = { compact: 130, expanded: 420 } as const;

/**
 * Doctors tab: any NFZ specialist the app knows about, whether the plan recommends it or not.
 * Compact map (expandable) + list; every filter sits behind one "Filtry" button above both.
 */
export default function DoctorsScreen() {
  const { colors, space, radius } = useTheme();
  // Same fallback as FacilitiesScreen until onboarding always creates an active profile.
  const profile = useProfilesStore(selectActiveProfile) ?? mockProfileMama;
  const location = profile.location;

  const [examId, setExamId] = useState<SpecialtyExamId>(SPECIALTY_EXAM_IDS[0]);
  const [sort, setSort] = useState<FacilitiesSort>('soonest');
  const [maxDistance, setMaxDistance] = useState<MaxDistance>(defaultFacilityFilters.maxDistance);
  const [features, setFeatures] = useState<FacilityFeature[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const defaultKey = useDefaultFacilityStore((s) => s.facility?.key ?? null);

  const query = useMemo(
    () =>
      location
        ? {
            examId,
            province: location.province,
            lat: location.lat,
            lng: location.lng,
            sort,
            limit: LIMIT,
          }
        : null,
    [examId, location, sort],
  );
  const state = useFacilities(query);

  if (!location) {
    return (
      <Screen wall edges={['left', 'right']}>
        <Plate>
          <DefaultFacilityCard />
        </Plate>
        <Plate>
          <EmptyState
            icon="info"
            title={t('facilities.states.noLocationTitle')}
            body={t('facilities.states.noLocationBody')}
          />
        </Plate>
      </Screen>
    );
  }

  const all = state.status === 'success' ? state.data.items : [];
  const items = pinDefaultFirst(filterFacilities(all, { maxDistance, features }), defaultKey);
  const selected = items.find((f) => f.id === selectedId);
  const activeCount = (maxDistance === 'any' ? 0 : 1) + features.length;
  const clearFilters = () => {
    setMaxDistance(defaultFacilityFilters.maxDistance);
    setFeatures([]);
  };

  let results: ReactNode;
  if (state.status === 'loading') {
    results = <FacilitySkeleton />;
  } else if (state.status === 'error') {
    results = (
      <EmptyState
        icon="alert"
        title={t('facilities.states.errorTitle')}
        body={t('facilities.states.errorBody')}
        action={{ label: t('facilities.states.retry'), onPress: state.retry }}
      />
    );
  } else if (all.length === 0) {
    results = <EmptyState icon="info" title={t('facilities.states.emptyTitle')} />;
  } else if (items.length === 0) {
    results = (
      <EmptyState
        icon="info"
        title={t('doctors.noMatchTitle')}
        body={t('doctors.noMatchBody')}
        action={{ label: t('doctors.clearFilters'), onPress: clearFilters }}
      />
    );
  } else {
    const rest = items.filter((f) => f.id !== selected?.id);
    results = (
      <>
        {selected ? (
          // The pin the user tapped, highlighted right under the map.
          <View
            testID="doctors-selected"
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: radius.md,
              paddingHorizontal: space.md,
            }}
          >
            <FacilityRow facility={selected} examId={examId} primary sort={sort} />
          </View>
        ) : (
          <Text variant="caption" tone="textMuted">
            {t('doctors.mapHint')}
          </Text>
        )}
        <FacilityRows>
          {rest.map((f, i) => (
            <FacilityRow
              key={f.id}
              facility={f}
              examId={examId}
              primary={!selected && i === 0}
              sort={sort}
            />
          ))}
        </FacilityRows>
      </>
    );
  }

  return (
    <Screen wall edges={['left', 'right']}>
      <Plate>
        <DefaultFacilityCard />
      </Plate>
      <Plate>
        {/* Filters sit above both the map and the list, since they narrow both. */}
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm }}
        >
          <FiltersButton activeCount={activeCount} onPress={() => setFiltersOpen(true)} />
          {state.status === 'success' && (
            <Text
              variant="caption"
              tone="textMuted"
              accessibilityLiveRegion="polite"
              style={{ flexShrink: 1 }}
            >
              {t('doctors.summary', {
                specialty: t(`doctors.specialty.options.${examId}`),
                count: items.length,
                total: all.length,
              })}
            </Text>
          )}
        </View>
        <View style={{ gap: space.xs }}>
          <View
            testID="doctors-map"
            style={{ height: mapExpanded ? MAP_HEIGHT.expanded : MAP_HEIGHT.compact }}
          >
            <FacilitiesMap
              facilities={items}
              origin={{ lat: location.lat, lng: location.lng }}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </View>
          <Button
            testID="doctors-map-toggle"
            variant="ghost"
            icon={mapExpanded ? 'chevronUp' : 'chevronDown'}
            label={mapExpanded ? t('doctors.mapCollapse') : t('doctors.mapExpand')}
            onPress={() => setMapExpanded((v) => !v)}
          />
        </View>
        {results}
      </Plate>
      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        examId={examId}
        onExamId={(id) => {
          setExamId(id);
          setSelectedId(undefined);
        }}
        maxDistance={maxDistance}
        onMaxDistance={setMaxDistance}
        features={features}
        onFeatures={setFeatures}
        sort={sort}
        onSort={setSort}
        resultCount={state.status === 'success' ? items.length : null}
      />
    </Screen>
  );
}
