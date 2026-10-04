import { addDays, format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ISODateSchema, type ISODate } from '@naczas/shared';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { SegmentedControl } from '@/features/facilities/SegmentedControl';
import { t } from '@/i18n';
import { selectActiveProfile, useProfilesStore, useToday } from '@/store';
import {
  newSlotId,
  selectSlots,
  useAvailabilityStore,
  type SlotKind,
} from '@/store/availability-store';
import { useTheme } from '@/theme';

import { DAY_END, DAY_START, toMinutes, weekDays, weekStart } from './availability';
import { SlotEditor } from './SlotEditor';
import { WeekGrid } from './WeekGrid';

const shiftWeek = (start: ISODate, weeks: number) =>
  format(addDays(parseISO(start), weeks * 7), 'yyyy-MM-dd');

/** "19–25 października", "26 października – 1 listopada" */
function weekTitle(days: readonly ISODate[]): string {
  const first = parseISO(days[0] ?? '');
  const last = parseISO(days[days.length - 1] ?? '');
  return first.getMonth() === last.getMonth()
    ? `${format(first, 'd')}–${format(last, 'd MMMM', { locale: pl })}`
    : `${format(first, 'd MMMM', { locale: pl })} – ${format(last, 'd MMMM', { locale: pl })}`;
}

/** "Kiedy możesz?" — a week view of the patient's free time, read by the voice agent. */
export default function AvailabilityScreen() {
  const { firstDate } = useLocalSearchParams<{ firstDate?: string }>();
  const { space, layout, colors, radius, borderWidth } = useTheme();
  const today = useToday();
  const patient = useProfilesStore(selectActiveProfile);
  const slots = useAvailabilityStore(selectSlots(patient?.id));
  const { addSlot, updateSlot, removeSlot } = useAvailabilityStore.getState();

  // URL params are external input (AGENTS.md §3).
  const parsed = ISODateSchema.safeParse(firstDate);
  const nearest = parsed.success && parsed.data >= today ? parsed.data : null;
  const thisWeek = weekStart(today);
  // Opens on the week of the facility's first free day — the one the user has to plan.
  const [start, setStart] = useState<ISODate>(weekStart(nearest ?? today));
  const [editing, setEditing] = useState<{ id: string; date: ISODate } | null>(null);
  // What a new drag marks: green "mogę" or red "nie mogę".
  const [mode, setMode] = useState<SlotKind>('free');

  if (!patient) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState icon="info" title={t('exam.notFound.title')} />
      </Screen>
    );
  }

  const days = weekDays(start);
  const selected = editing && slots.find((s) => s.id === editing.id);

  // The editor floats over the grid instead of taking its height: the week keeps its full size.
  // It sits on the half of the day away from the edited block, so the block stays visible.
  const editorOnTop = !!selected && toMinutes(selected.from) >= (DAY_START + DAY_END) / 2;
  const editor =
    selected && editing ? (
      <SlotEditor
        slot={selected}
        date={editing.date}
        onChange={(slot) => updateSlot(patient.id, slot)}
        onDelete={() => {
          removeSlot(patient.id, selected.id);
          setEditing(null);
        }}
        onDone={() => setEditing(null)}
      />
    ) : null;
  const footer = (
    <Button label={t('callAssist.availability.done')} fullWidth onPress={() => router.back()} />
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} scroll={false} footer={footer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {start > thisWeek ? (
          <IconButton
            icon="chevronLeft"
            accessibilityLabel={t('callAssist.availability.prevWeek')}
            onPress={() => setStart(shiftWeek(start, -1))}
          />
        ) : (
          <View style={{ width: layout.minTouch }} />
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="heading" accessibilityRole="header">
            {weekTitle(days)}
          </Text>
          {nearest && days.includes(nearest) && (
            <Text variant="caption" tone="textMuted">
              {`◯ ${t('callAssist.availability.legendNearest')}`}
            </Text>
          )}
        </View>
        <IconButton
          icon="chevronRight"
          accessibilityLabel={t('callAssist.availability.nextWeek')}
          onPress={() => setStart(shiftWeek(start, 1))}
        />
      </View>
      <SegmentedControl
        label={t('callAssist.availability.mode')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'free', label: t('callAssist.availability.modeFree') },
          { value: 'busy', label: t('callAssist.availability.modeBusy') },
        ]}
      />
      <View style={{ flex: 1 }}>
        <WeekGrid
          days={days}
          today={today}
          nearest={nearest}
          slots={slots}
          mode={mode}
          selectedId={selected?.id ?? null}
          onCreate={(date, from, to) => {
            const id = newSlotId();
            addSlot(patient.id, { id, from, to, kind: mode, repeat: 'once', date });
            setEditing({ id, date });
          }}
          onSelect={(slot, date) => setEditing({ id: slot.id, date })}
        />
        {editor && (
          <View
            testID="slot-editor-overlay"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              ...(editorOnTop ? { top: 0 } : { bottom: 0 }),
              maxHeight: '80%',
              backgroundColor: colors.surface,
              borderWidth: borderWidth.plate,
              borderColor: colors.text,
              borderRadius: radius.plate,
              borderCurve: 'continuous',
              overflow: 'hidden',
            }}
          >
            <ScrollView contentContainerStyle={{ padding: space.md }}>{editor}</ScrollView>
          </View>
        )}
      </View>
    </Screen>
  );
}
