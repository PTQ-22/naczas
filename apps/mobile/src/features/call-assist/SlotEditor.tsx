import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { View } from 'react-native';

import type { ISODate } from '@naczas/shared';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { SegmentedControl } from '@/features/facilities/SegmentedControl';
import { ToggleRow } from '@/features/settings/ToggleRow';
import { t } from '@/i18n';
import { slotKind, type Slot } from '@/store/availability-store';
import { useTheme } from '@/theme';

import { shiftEdge, STEP, withKind, withRepeat } from './availability';

interface SlotEditorProps {
  slot: Slot;
  /** The day the block was tapped on — a weekly block shows on many */
  date: ISODate;
  onChange: (slot: Slot) => void;
  onDelete: () => void;
  onDone: () => void;
}

function Edge({
  label,
  value,
  onEarlier,
  onLater,
}: {
  label: string;
  value: string;
  onEarlier: () => void;
  onLater: () => void;
}) {
  const { space } = useTheme();
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <IconButton
        icon="minus"
        accessibilityLabel={t('callAssist.availability.earlier', { edge: label })}
        onPress={onEarlier}
      />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text variant="caption" tone="textMuted">
          {label}
        </Text>
        <Text variant="heading" tabular>
          {value}
        </Text>
      </View>
      <IconButton
        icon="plus"
        accessibilityLabel={t('callAssist.availability.later', { edge: label })}
        onPress={onLater}
      />
    </View>
  );
}

/** Bottom panel for the selected block — the "event details" of the week view. */
export function SlotEditor({ slot, date, onChange, onDelete, onDone }: SlotEditorProps) {
  const { space } = useTheme();
  const weekly = slot.repeat === 'weekly';
  const day = format(parseISO(date), weekly ? 'EEEE' : 'EEEE, d MMMM', { locale: pl });
  const title = weekly ? t('callAssist.availability.weeklyTitle', { weekday: day }) : day;
  const from = t('callAssist.availability.from');
  const to = t('callAssist.availability.to');

  return (
    <View style={{ gap: space.sm }} testID="slot-editor">
      <Text variant="label" accessibilityRole="header">
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Edge
          label={from}
          value={slot.from}
          onEarlier={() => onChange(shiftEdge(slot, 'from', -STEP))}
          onLater={() => onChange(shiftEdge(slot, 'from', STEP))}
        />
        <Edge
          label={to}
          value={slot.to}
          onEarlier={() => onChange(shiftEdge(slot, 'to', -STEP))}
          onLater={() => onChange(shiftEdge(slot, 'to', STEP))}
        />
      </View>
      <SegmentedControl
        label={t('callAssist.availability.kind')}
        value={slotKind(slot)}
        onChange={(kind) => onChange(withKind(slot, kind))}
        options={[
          { value: 'free', label: t('callAssist.availability.modeFree') },
          { value: 'busy', label: t('callAssist.availability.modeBusy') },
        ]}
      />
      <ToggleRow
        label={t('callAssist.availability.repeat')}
        value={weekly}
        onChange={(value) => onChange(withRepeat(slot, value, date))}
        testID="slot-repeat"
      />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('callAssist.availability.delete')}
            variant="secondary"
            fullWidth
            onPress={onDelete}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('callAssist.availability.done')} fullWidth onPress={onDone} />
        </View>
      </View>
    </View>
  );
}
