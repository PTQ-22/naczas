import { View } from 'react-native';

import { Text } from '@/components/Text';
import { duration } from '@/features/call-assist/task-status';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { RING_TICKS, ringSegments } from './ring';

const SIZE = 196;
const TICK_W = 9;
const TICK_H = 24;

interface SavedTimeRingProps {
  waitedSec: number;
  talkedSec: number;
  attempts: number;
  booked: number;
}

/**
 * Donut of the phone time the agent took over: segments for waiting on the line and for talking,
 * the total in the middle. Drawn with plain Views (60 ticks) — no chart/SVG dependency, so it
 * renders the same in Expo Go and on web.
 */
export function SavedTimeRing({ waitedSec, talkedSec, attempts, booked }: SavedTimeRingProps) {
  const { colors, space } = useTheme();
  const total = waitedSec + talkedSec;
  const { waited } = ringSegments(waitedSec, talkedSec);
  const waitedColor = colors.primary;
  const talkedColor = colors.urgency.done.accent;
  const emptyColor = colors.border;
  const totalLabel = total > 0 ? duration(total) : t('callAssist.duration.minutes', { n: 0 });

  const a11y = t('agent.ring.a11y', {
    total: totalLabel,
    waited: duration(waitedSec),
    talked: duration(talkedSec),
  });

  return (
    <View
      style={{ alignItems: 'center', gap: space.md }}
      testID="agent-saved"
      accessible
      accessibilityLabel={a11y}
    >
      <View style={{ width: SIZE, height: SIZE }}>
        {Array.from({ length: RING_TICKS }, (_, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: SIZE,
              height: SIZE,
              alignItems: 'center',
              transform: [{ rotate: `${(360 / RING_TICKS) * i}deg` }],
            }}
          >
            <View
              style={{
                width: TICK_W,
                height: TICK_H,
                borderRadius: TICK_W / 2,
                backgroundColor: total === 0 ? emptyColor : i < waited ? waitedColor : talkedColor,
              }}
            />
          </View>
        ))}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.xs / 2,
          }}
        >
          <Text variant="title" tabular testID="agent-saved-total">
            {totalLabel}
          </Text>
          <Text variant="caption" tone="textMuted">
            {t('agent.ring.centerLabel')}
          </Text>
        </View>
      </View>

      {total > 0 ? (
        <View style={{ gap: space.xs, alignSelf: 'stretch' }}>
          <Legend color={waitedColor} label={t('agent.ring.waited')} value={duration(waitedSec)} />
          <Legend color={talkedColor} label={t('agent.ring.talked')} value={duration(talkedSec)} />
          <Text variant="caption" tone="textMuted" style={{ textAlign: 'center' }}>
            {t('agent.ring.footer', { calls: attempts, booked })}
          </Text>
        </View>
      ) : (
        <Text tone="textMuted" style={{ textAlign: 'center' }}>
          {t('agent.ring.none')}
        </Text>
      )}
    </View>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <Text style={{ flex: 1 }}>{label}</Text>
      <Text tabular>{value}</Text>
    </View>
  );
}
