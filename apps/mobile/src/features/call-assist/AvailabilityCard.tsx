import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { router } from 'expo-router';
import { View } from 'react-native';

import type { ISODate } from '@naczas/shared';

import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import type { Slot } from '@/store/availability-store';
import { useTheme } from '@/theme';

import { upcomingOnce, weeklySummary } from './availability';

interface AvailabilityCardProps {
  examId: string;
  slots: readonly Slot[];
  today: ISODate;
  /** The facility's first free date, when known */
  nearest: ISODate | null;
}

/** What the agent will say about the patient's free time, and the way into the week view. */
export function AvailabilityCard({ examId, slots, today, nearest }: AvailabilityCardProps) {
  const { space } = useTheme();
  const weekly = weeklySummary(slots);
  const once = upcomingOnce(slots, today);
  const busyWeekly = weeklySummary(slots, 'busy');
  const busyOnce = upcomingOnce(slots, today, 'busy');
  const empty = weekly.length === 0 && once === 0 && busyWeekly.length === 0 && busyOnce === 0;

  return (
    <Plate testID="availability-card">
      <View style={{ gap: space.xs }}>
        <Text variant="label" accessibilityRole="header">
          {t('callAssist.availability.cardTitle')}
        </Text>
        {empty && <Text tone="textMuted">{t('callAssist.availability.none')}</Text>}
        {weekly.map((line) => (
          <Text key={line}>{`↻ ${line}`}</Text>
        ))}
        {once > 0 && <Text>{t('callAssist.availability.once', { count: once })}</Text>}
        {busyWeekly.map((line) => (
          <Text key={`busy-${line}`} tone="danger">
            {t('callAssist.availability.busyLine', { line })}
          </Text>
        ))}
        {busyOnce > 0 && (
          <Text tone="danger">{t('callAssist.availability.busyOnce', { count: busyOnce })}</Text>
        )}
        {nearest && (
          <Text tone="textMuted">
            {t('callAssist.availability.nearest', {
              date: format(parseISO(nearest), 'd MMMM', { locale: pl }),
            })}
          </Text>
        )}
      </View>
      <Button
        label={t(empty ? 'callAssist.availability.open' : 'callAssist.availability.edit')}
        accessibilityLabel={t('callAssist.availability.openA11y')}
        variant="secondary"
        icon="calendar"
        fullWidth
        onPress={() =>
          router.push({
            pathname: '/exam/[examId]/availability',
            params: { examId, ...(nearest && { firstDate: nearest }) },
          })
        }
      />
    </Plate>
  );
}
