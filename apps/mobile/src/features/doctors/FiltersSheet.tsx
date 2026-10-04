import { use } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { SegmentedControl } from '@/features/facilities/SegmentedControl';
import type { FacilitiesSort } from '@/features/facilities/use-facilities';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { SPECIALTY_EXAM_IDS, type SpecialtyExamId } from './specialties';

import type { FacilityFeature, MaxDistance } from './filter-facilities';

const DISTANCES: readonly MaxDistance[] = ['any', '10', '25', '50'];
const FEATURES: readonly FacilityFeature[] = ['phone', 'ramp', 'elevator', 'parking', 'toilet'];

interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  examId: SpecialtyExamId;
  onExamId: (id: SpecialtyExamId) => void;
  maxDistance: MaxDistance;
  onMaxDistance: (d: MaxDistance) => void;
  features: FacilityFeature[];
  onFeatures: (f: FacilityFeature[]) => void;
  sort: FacilitiesSort;
  onSort: (s: FacilitiesSort) => void;
  /** Matching facilities, null while loading — shown on the "Pokaż wyniki" button. */
  resultCount: number | null;
}

/** Bottom sheet with every doctors-tab filter; changes apply live, the button just closes it. */
export function FiltersSheet(props: FiltersSheetProps) {
  const { colors, space, radius, borderWidth } = useTheme();
  // Context (not the hook) so tests without a SafeAreaProvider get 0 instead of throwing.
  const bottomInset = use(SafeAreaInsetsContext)?.bottom ?? 0;
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
      accessibilityViewIsModal
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Dimmed backdrop from the ink token (no hardcoded colour); tap closes the sheet. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('doctors.filters.close')}
          onPress={props.onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.text,
            opacity: 0.4,
          }}
        />
        <View
          style={{
            maxHeight: '85%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            borderTopWidth: borderWidth.plate,
            borderColor: colors.text,
            paddingBottom: bottomInset + space.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: space.lg,
              paddingTop: space.md,
            }}
          >
            <Text variant="heading" accessibilityRole="header">
              {t('doctors.filters.title')}
            </Text>
            <IconButton
              icon="close"
              accessibilityLabel={t('doctors.filters.close')}
              onPress={props.onClose}
            />
          </View>
          <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
            <View style={{ gap: space.xs }}>
              <Text variant="label">{t('doctors.specialty.label')}</Text>
              <ChipGroup
                groupLabel={t('doctors.specialty.label')}
                options={SPECIALTY_EXAM_IDS.map((id) => ({
                  value: id,
                  label: t(`doctors.specialty.options.${id}`),
                }))}
                selected={props.examId}
                onSelect={props.onExamId}
              />
            </View>
            <View style={{ gap: space.xs }}>
              <Text variant="label">{t('doctors.filters.distance')}</Text>
              <ChipGroup
                groupLabel={t('doctors.filters.distance')}
                options={DISTANCES.map((d) => ({
                  value: d,
                  label: t(`doctors.filters.distanceOptions.${d}`),
                }))}
                selected={props.maxDistance}
                onSelect={props.onMaxDistance}
              />
            </View>
            <View style={{ gap: space.xs }}>
              <Text variant="label">{t('doctors.filters.features')}</Text>
              <ChipGroup
                mode="multi"
                groupLabel={t('doctors.filters.features')}
                options={FEATURES.map((f) => ({
                  value: f,
                  label: t(`doctors.filters.featureOptions.${f}`),
                }))}
                selected={props.features}
                onChange={props.onFeatures}
              />
            </View>
            <SegmentedControl
              label={t('facilities.sort.label')}
              value={props.sort}
              onChange={props.onSort}
              options={[
                { value: 'soonest', label: t('facilities.sort.soonest') },
                { value: 'nearest', label: t('facilities.sort.nearest') },
              ]}
            />
            <Button
              testID="doctors-filters-apply"
              fullWidth
              label={
                props.resultCount === null
                  ? t('doctors.filters.applyLoading')
                  : t('doctors.filters.apply', { count: props.resultCount })
              }
              onPress={props.onClose}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
