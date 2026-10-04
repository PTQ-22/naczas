import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { isoWeekday, type ISODate, type TimeOfDay } from '@naczas/shared';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { slotKind, type Slot, type SlotKind } from '@/store/availability-store';
import { useTheme } from '@/theme';

import { DAY_END, DAY_START, rangeFromDrag, slotsOn, toMinutes } from './availability';

interface WeekGridProps {
  /** Monday … Sunday of the shown week */
  days: readonly ISODate[];
  today: ISODate;
  /** The facility's first free date — ringed in the header */
  nearest: ISODate | null;
  slots: readonly Slot[];
  /** Kind of block a new drag creates — colours the draft */
  mode: SlotKind;
  selectedId: string | null;
  onCreate: (date: ISODate, from: TimeOfDay, to: TimeOfDay) => void;
  onSelect: (slot: Slot, date: ISODate) => void;
}

const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START / 60 + i);
/** Below this the finger only tapped — a tap makes a one-hour block. */
const TAP_SLOP = 8;
/** Columns are ~45 pt wide: "10" instead of "10:00", but "10:30" stays. */
const short = (time: TimeOfDay) => time.replace(/^0/, '').replace(/:00$/, '');
const longDate = (date: ISODate) => format(parseISO(date), 'EEEE, d MMMM', { locale: pl });

/**
 * Google-Calendar-style week: drag down an empty column to mark free time, tap an empty spot for
 * an hour, tap a block to edit it. Rows stretch to fill the screen, so there is no inner scroll
 * fighting the drag. PanResponder (core RN) works the same in Expo Go and on web.
 */
export function WeekGrid({
  days,
  today,
  nearest,
  slots,
  mode,
  selectedId,
  onCreate,
  onSelect,
}: WeekGridProps) {
  const { colors, space, radius, borderWidth, layout } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<{ col: number; a: number; b: number } | null>(null);
  const colW = size.width / days.length;
  const rowH = size.height / HOURS.length;
  const gutter = space['2xl'] + space.xs;

  // The responder is created once; it reads the latest geometry and callbacks from here.
  const live = useRef({ colW, rowH, days, today, onCreate });
  useEffect(() => {
    live.current = { colW, rowH, days, today, onCreate };
  });
  const drag = useRef<{ col: number; a: number; y0: number } | null>(null);

  // The refs are only read inside gesture callbacks, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => {
    const minutesAt = (y: number) => DAY_START + (y / live.current.rowH) * 60;
    const end = () => {
      drag.current = null;
      setDraft(null);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { colW: w, rowH: h, days: d, today: now } = live.current;
        const { locationX, locationY } = e.nativeEvent;
        const col = Math.floor(locationX / w);
        const date = d[col];
        if (!w || !h || !date || date < now) return;
        const a = minutesAt(locationY);
        drag.current = { col, a, y0: locationY };
        setDraft({ col, a, b: a });
      },
      onPanResponderMove: (_, g) => {
        const d = drag.current;
        if (d) setDraft({ col: d.col, a: d.a, b: minutesAt(d.y0 + g.dy) });
      },
      onPanResponderRelease: (_, g) => {
        const d = drag.current;
        end();
        const date = d && live.current.days[d.col];
        if (!d || !date) return;
        const b = Math.abs(g.dy) < TAP_SLOP ? d.a : minutesAt(d.y0 + g.dy);
        const { from, to } = rangeFromDrag(d.a, b);
        live.current.onCreate(date, from, to);
      },
      onPanResponderTerminate: end,
    });
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const block = (from: TimeOfDay, to: TimeOfDay, col: number) => ({
    position: 'absolute' as const,
    left: col * colW + borderWidth.strong,
    width: colW - 2 * borderWidth.strong,
    top: ((toMinutes(from) - DAY_START) / 60) * rowH,
    height: ((toMinutes(to) - toMinutes(from)) / 60) * rowH,
  });
  const draftRange = draft && rangeFromDrag(draft.a, draft.b);
  // Light green = can come, light red = surely can't — the urgency "done" / "act now" tokens.
  const palette = (kind: SlotKind) =>
    kind === 'busy' ? colors.urgency.act_now : colors.urgency.done;

  return (
    <View style={{ flex: 1, gap: space.xs }}>
      {/* Day headers: tapping one adds an hour on that day (also the screen-reader path). */}
      <View style={{ flexDirection: 'row', paddingLeft: gutter }}>
        {days.map((date) => {
          const past = date < today;
          const isToday = date === today;
          const isNearest = date === nearest;
          return (
            <Pressable
              key={date}
              disabled={past}
              onPress={() => onCreate(date, '09:00', '10:00')}
              accessibilityRole="button"
              accessibilityLabel={
                isNearest
                  ? t('callAssist.availability.nearestA11y', { date: longDate(date) })
                  : t('callAssist.availability.addOnDay', { date: longDate(date) })
              }
              accessibilityState={{ disabled: past }}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: space.xs / 2,
                minHeight: layout.minTouch,
              }}
            >
              <Text variant="caption" tone={past ? 'textSubtle' : 'textMuted'} selectable={false}>
                {t(`callAssist.availability.weekday.${isoWeekday(date)}`)}
              </Text>
              <View
                style={{
                  minWidth: space.xl + space.sm,
                  height: space.xl + space.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.full,
                  backgroundColor: isToday ? colors.primary : 'transparent',
                  borderWidth: isNearest ? borderWidth.plate : 0,
                  borderColor: colors.primary,
                }}
              >
                <Text
                  variant="label"
                  tabular
                  selectable={false}
                  tone={isToday ? 'onPrimary' : past ? 'textSubtle' : 'text'}
                >
                  {Number(date.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: gutter }} pointerEvents="none">
          {size.height > 0 &&
            HOURS.map((h, i) => (
              <Text
                key={h}
                variant="caption"
                tone="textMuted"
                tabular
                selectable={false}
                style={{ position: 'absolute', top: i * rowH - space.sm, right: space.xs }}
              >
                {i === 0 ? '' : `${h}:00`}
              </Text>
            ))}
        </View>

        <View
          style={{ flex: 1, borderTopWidth: borderWidth.hairline, borderColor: colors.border }}
          onLayout={onLayout}
          {...pan.panHandlers}
        >
          {/* Hour lines, day separators and past-day shading are decoration only. */}
          {HOURS.map((h, i) => (
            <View
              key={h}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: (i + 1) * rowH,
                borderTopWidth: borderWidth.hairline,
                borderColor: colors.border,
              }}
            />
          ))}
          {days.map((date, col) => (
            <View
              key={date}
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: col * colW,
                width: colW,
                borderLeftWidth: borderWidth.hairline,
                borderColor: colors.border,
                backgroundColor: date < today ? colors.surfaceAlt : 'transparent',
              }}
            />
          ))}

          {size.width > 0 &&
            days.flatMap((date, col) =>
              slotsOn(slots, date).map((slot) => {
                const selected = slot.id === selectedId;
                const weekly = slot.repeat === 'weekly';
                const busy = slotKind(slot) === 'busy';
                const tint = palette(slotKind(slot));
                const ink = selected ? colors.surface : tint.fg;
                return (
                  <Pressable
                    key={`${slot.id}-${date}`}
                    onPress={() => onSelect(slot, date)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      weekly
                        ? t(
                            busy
                              ? 'callAssist.availability.slotBusyWeeklyA11y'
                              : 'callAssist.availability.slotWeeklyA11y',
                            {
                              weekday: format(parseISO(date), 'EEEE', { locale: pl }),
                              from: slot.from,
                              to: slot.to,
                            },
                          )
                        : t(
                            busy
                              ? 'callAssist.availability.slotBusyA11y'
                              : 'callAssist.availability.slotA11y',
                            {
                              date: longDate(date),
                              from: slot.from,
                              to: slot.to,
                            },
                          )
                    }
                    accessibilityState={{ selected }}
                    style={{
                      ...block(slot.from, slot.to, col),
                      overflow: 'hidden',
                      paddingHorizontal: space.xs / 2,
                      paddingVertical: space.xs / 2,
                      borderRadius: radius.sm / 2,
                      borderLeftWidth: borderWidth.plate * 1.5,
                      borderColor: tint.accent,
                      backgroundColor: selected ? tint.accent : tint.bg,
                      opacity: date < today ? 0.5 : 1,
                    }}
                  >
                    <Text
                      variant="caption"
                      tabular
                      selectable={false}
                      color={ink}
                      numberOfLines={1}
                    >
                      {short(slot.from)}
                    </Text>
                    <Text
                      variant="caption"
                      tabular
                      selectable={false}
                      color={ink}
                      numberOfLines={1}
                    >
                      {weekly ? `${short(slot.to)} ↻` : `–${short(slot.to)}`}
                    </Text>
                  </Pressable>
                );
              }),
            )}

          {draft && draftRange && (
            <View
              pointerEvents="none"
              style={{
                ...block(draftRange.from, draftRange.to, draft.col),
                borderRadius: radius.sm / 2,
                backgroundColor: palette(mode).accent,
                opacity: 0.6,
                padding: space.xs / 2,
              }}
            >
              <Text variant="caption" color={colors.surface} tabular selectable={false}>
                {short(draftRange.from)}
              </Text>
              <Text variant="caption" color={colors.surface} tabular selectable={false}>
                {`–${short(draftRange.to)}`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
