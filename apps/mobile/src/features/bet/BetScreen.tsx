import { format, parseISO } from 'date-fns';
import { pl as plLocale } from 'date-fns/locale';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  Disclaimer,
  EmptyState,
  ProgressBar,
  Screen,
  Text,
} from '@/components';
import { t } from '@/i18n';
import { usePlan } from '@/services';
import {
  activeBetForProfile,
  betsForProfile,
  selectActiveProfile,
  useBetStore,
  useProfilesStore,
  useRecordsStore,
  useToday,
} from '@/store';
import { useTheme } from '@/theme';

import { Confetti } from './Confetti';
import { betProgress, resolveBetStatus } from './resolve-bets';

const BET_AMOUNTS = [10, 20, 50] as const;
/** Default bet duration in days. */
const BET_DURATION_DAYS = 90;

const longDate = (date: string) => format(parseISO(date), 'd MMMM yyyy', { locale: plLocale });

function motivationMessage(ratio: number): string {
  if (ratio >= 0.75) return t('bet.active.motivationGood');
  if (ratio >= 0.4) return t('bet.active.motivationHalf');
  return t('bet.active.motivationStart');
}

export default function BetScreen() {
  const { space, colors } = useTheme();
  const today = useToday();
  const activeProfile = useProfilesStore(selectActiveProfile);
  const records = useRecordsStore((s) => s.records);
  const bets = useBetStore((s) => s.bets);
  const placeBet = useBetStore((s) => s.placeBet);
  const resolveBet = useBetStore((s) => s.resolveBet);

  const profileId = activeProfile?.id ?? '';
  const { plan } = usePlan(profileId);

  const [selectedAmount, setSelectedAmount] = useState<number>(BET_AMOUNTS[1]);
  const [justWon, setJustWon] = useState(false);

  // We need to resolve bet status as a side-effect, not during render (useMemo).
  const currentActiveBet = useMemo(() => activeBetForProfile(bets, profileId), [bets, profileId]);

  useEffect(() => {
    if (!currentActiveBet) return;
    const newStatus = resolveBetStatus(currentActiveBet, records, today);
    if (newStatus !== currentActiveBet.status) {
      resolveBet(currentActiveBet.id, newStatus);
      if (newStatus === 'won') {
        // Defer state update to avoid cascading render lint rule
        setTimeout(() => setJustWon(true), 0);
      }
    }
  }, [currentActiveBet, records, today, resolveBet]);

  const progress = useMemo(
    () => (currentActiveBet ? betProgress(currentActiveBet, records) : null),
    [currentActiveBet, records],
  );

  const history = useMemo(
    () => betsForProfile(bets, profileId).filter((b) => b.status !== 'active'),
    [bets, profileId],
  );

  // Urgent exams from the plan that haven't been done/booked yet
  const urgentExamIds = useMemo(() => {
    if (!plan) return [];
    return plan.items
      .filter((item) => item.urgency === 'act_now' || item.urgency === 'this_year')
      .filter((item) => {
        const record = records.find((r) => r.profileId === profileId && r.examId === item.examId);
        return !record || record.status === 'none';
      })
      .map((item) => item.examId);
  }, [plan, records, profileId]);

  const onPlaceBet = useCallback(() => {
    if (urgentExamIds.length === 0) return;
    const expiresAt = format(
      new Date(new Date(today).getTime() + BET_DURATION_DAYS * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd',
    );
    placeBet({
      id: `bet-${Date.now()}`,
      profileId,
      amountPln: selectedAmount,
      createdAt: today,
      expiresAt,
      status: 'active',
      examIds: urgentExamIds,
    });
  }, [urgentExamIds, today, placeBet, profileId, selectedAmount]);

  if (!activeProfile) {
    return (
      <Screen testID="bet-screen" edges={['left', 'right']}>
        <EmptyState title={t('bet.screen.title')} body={t('bet.screen.subtitle')} icon="trophy" />
      </Screen>
    );
  }

  return (
    <Screen testID="bet-screen" edges={['left', 'right']}>
      <Confetti fire={justWon} />
      <Text variant="title" accessibilityRole="header">
        {t('bet.screen.title')}
      </Text>
      <Text tone="textMuted">{t('bet.screen.subtitle')}</Text>

      {/* ── Active bet card ── */}
      {currentActiveBet && progress && currentActiveBet.status === 'active' ? (
        <Card accent={colors.urgency.act_now.accent} testID="bet-active-card">
          <Text variant="heading">{t('bet.active.title')}</Text>
          <Text variant="bodyLarge" style={{ fontWeight: '700' }}>
            {t('bet.active.amount', { amount: currentActiveBet.amountPln })}
          </Text>
          <Text tone="textMuted">
            {t('bet.active.deadline', { date: longDate(currentActiveBet.expiresAt) })}
          </Text>
          <ProgressBar
            value={progress.ratio}
            accessibilityLabel={t('bet.active.progress', {
              completed: progress.completed,
              total: progress.total,
            })}
          />
          <Text>
            {t('bet.active.progress', {
              completed: progress.completed,
              total: progress.total,
            })}
          </Text>
          <Text tone="textMuted" style={{ fontStyle: 'italic' }}>
            {motivationMessage(progress.ratio)}
          </Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Text tone="textMuted">
              {t('bet.active.deadline', { date: longDate(currentActiveBet.expiresAt) })}
            </Text>
          </View>
        </Card>
      ) : null}

      {/* ── Place new bet ── */}
      {!currentActiveBet ? (
        <Card testID="bet-place-card">
          <Text variant="heading">{t('bet.place.title')}</Text>
          <Text tone="textMuted">{t('bet.place.description')}</Text>

          {urgentExamIds.length > 0 ? (
            <>
              <Text variant="label">{t('bet.place.amountLabel')}</Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('bet.place.amountLabel')}
                style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}
              >
                {BET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    testID={`bet-amount-${amount}`}
                    variant={selectedAmount === amount ? 'primary' : 'secondary'}
                    label={`${amount} zł`}
                    onPress={() => setSelectedAmount(amount)}
                    accessibilityLabel={`${amount} złotych`}
                  />
                ))}
              </View>
              <Text tone="textMuted">
                {t('bet.place.examCount', { count: urgentExamIds.length })}
              </Text>
              <Text tone="textMuted">
                {t('bet.place.deadlineInfo', { days: BET_DURATION_DAYS })}
              </Text>

              <View
                style={{
                  backgroundColor: colors.surfaceAlt,
                  padding: space.sm,
                  borderRadius: space.sm,
                  marginVertical: space.sm,
                }}
              >
                <Text tone="textMuted" variant="label" style={{ textAlign: 'center' }}>
                  {t('bet.place.payDisclaimer')}
                </Text>
              </View>

              <Button
                testID="bet-place-confirm"
                label={t('bet.place.payButton', { amount: selectedAmount })}
                accessibilityLabel={t('bet.place.confirmA11y')}
                icon="heart"
                onPress={onPlaceBet}
                fullWidth
              />
            </>
          ) : (
            <EmptyState title={t('bet.place.noExams')} icon="check" />
          )}
        </Card>
      ) : null}

      {/* ── History ── */}
      <Text variant="heading" accessibilityRole="header">
        {t('bet.history.title')}
      </Text>
      {history.length === 0 ? (
        <Text tone="textMuted">{t('bet.history.empty')}</Text>
      ) : (
        history.map((b) => (
          <Card
            key={b.id}
            testID={`bet-history-${b.id}`}
            accent={b.status === 'won' ? colors.urgency.done.accent : colors.urgency.act_now.accent}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text variant="label">{b.amountPln} zł</Text>
              <Chip
                label={t(`bet.history.${b.status}`)}
                tone={b.status === 'won' ? 'done' : 'act_now'}
                icon={b.status === 'won' ? 'check' : 'alert'}
              />
            </View>
            <Text tone="textMuted">
              {longDate(b.createdAt)} — {longDate(b.expiresAt)}
            </Text>
            <Text style={{ fontStyle: 'italic' }}>
              {b.status === 'won'
                ? t('bet.history.wonMessage')
                : t('bet.history.lostMessage', { amount: b.amountPln })}
            </Text>
          </Card>
        ))
      )}

      <Disclaimer text={t('bet.disclaimer')} />
    </Screen>
  );
}
