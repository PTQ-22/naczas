import { format, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { rules } from '@naczas/rules';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { successHaptic } from '@/components/haptics';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import {
  findRecord,
  selectActiveProfile,
  useProfilesStore,
  useRecordsStore,
  useToday,
} from '@/store';
import { useTheme } from '@/theme';

import { bookingRange, initialBookedFor, initialBookedTime, validateBookedFor } from './book-date';
import { BookDatePicker } from './BookDatePicker';
import { BookTimePicker } from './BookTimePicker';

const fullDate = (iso: string) => format(parseISO(iso), 'dd.MM.yyyy');

export default function BookScreen() {
  const { examId, facility } = useLocalSearchParams<{ examId: string; facility?: string }>();
  const { space } = useTheme();
  const today = useToday();
  const profile = useProfilesStore(selectActiveProfile);
  const records = useRecordsStore((s) => s.records);
  const markBooked = useRecordsStore((s) => s.markBooked);
  const rule = rules.find((r) => r.id === examId);
  const existing = profile && rule ? findRecord(records, profile.id, rule.id) : undefined;

  const [value, setValue] = useState(() => initialBookedFor(today, existing));
  const [time, setTime] = useState(() => initialBookedTime(existing));
  const error = validateBookedFor(value, today);
  const { min, max } = bookingRange(today);

  if (!rule || !profile) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState
          icon="info"
          title={rule ? t('exam.book.noProfile') : t('exam.notFound.title')}
          body={rule ? undefined : t('exam.notFound.body')}
        />
      </Screen>
    );
  }

  const save = () => {
    if (error) return;
    // markBooked keeps lastDone and remembers the previous record for undo.
    markBooked(profile.id, rule.id, value, time);
    successHaptic();
    router.back();
  };

  return (
    <Screen
      edges={['left', 'right', 'bottom']}
      footer={
        <Button
          label={t('exam.book.save')}
          accessibilityLabel={
            error ? undefined : t('exam.book.saveA11y', { date: fullDate(value), time })
          }
          disabled={error !== null}
          fullWidth
          onPress={save}
        />
      }
    >
      <View style={{ gap: space.xs }}>
        <Text variant="title" accessibilityRole="header">
          {rule.name}
        </Text>
        {/* Facility name is shown for context only: ExamRecord has no field for it. */}
        {facility ? (
          <Text tone="textMuted">{t('exam.book.facility', { name: facility })}</Text>
        ) : null}
      </View>

      <Text variant="heading">{t('exam.book.question')}</Text>
      <BookDatePicker value={value} min={min} max={max} onChange={setValue} />
      <BookTimePicker value={time} onChange={setTime} />
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {t(`exam.book.errors.${error}`)}
        </Text>
      ) : (
        <Text tone="textMuted">{t('exam.book.reminder')}</Text>
      )}
    </Screen>
  );
}
