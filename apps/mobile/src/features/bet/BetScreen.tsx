import { format, parseISO } from 'date-fns';
import { pl as plLocale } from 'date-fns/locale';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { Button, Disclaimer, EmptyState, Plate, ProgressBar, Screen, Text } from '@/components';
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
  const { space, colors, borderWidth, type } = useTheme();
  // Sections on the plate are separated by the plate's ink rule (redesign v2), not cards.
  const section = {
    gap: space.sm,
    paddingTop: space.md,
    borderTopWidth: borderWidth.strong,
    borderTopColor: colors.text,
  };
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
    <Screen wall testID="bet-screen" edges={['left', 'right']}>
      <Confetti fire={justWon} />
      <View style={{ gap: space.xs }}>
        <Text variant="display" color={colors.onWall} accessibilityRole="header">
          {t('bet.screen.title')}
        </Text>
        <Text color={colors.onWall}>{t('bet.screen.subtitle')}</Text>
      </View>

      <Plate>
        {/* ── Active bet ── */}
        {currentActiveBet && progress && currentActiveBet.status === 'active' ? (
          <View testID="bet-active-card" style={{ gap: space.sm }}>
            <Text variant="eyebrow" color={colors.urgency.act_now.fg}>
              {t('bet.active.title')}
            </Text>
            {/* Two-thirds of the plan's queue number: "20 zł" is wider than "29". */}
            <Text
              variant="ticket"
              tabular
              style={{
                fontSize: Math.round(type.ticket.fontSize * (2 / 3)),
                lineHeight: Math.round(type.ticket.lineHeight * (2 / 3)),
              }}
            >
              {t('bet.active.amount', { amount: currentActiveBet.amountPln })}
            </Text>
            <ProgressBar
              value={progress.ratio}
              accessibilityLabel={t('bet.active.progress', {
                completed: progress.completed,
                total: progress.total,
              })}
            />
            <Text variant="label">
              {t('bet.active.progress', {
                completed: progress.completed,
                total: progress.total,
              })}
            </Text>
            <Text tone="textMuted">{motivationMessage(progress.ratio)}</Text>
            <Text variant="caption" tone="textMuted">
              {t('bet.active.deadline', { date: longDate(currentActiveBet.expiresAt) })}
            </Text>
          </View>
        ) : null}

        {/* ── Place new bet ── */}
        {!currentActiveBet ? (
          <View testID="bet-place-card" style={{ gap: space.sm }}>
            <Text variant="eyebrow" tone="textMuted">
              {t('bet.place.title')}
            </Text>
            <Text>{t('bet.place.description')}</Text>

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
                <Text variant="caption" tone="textMuted">
                  {t('bet.place.payDisclaimer')}
                </Text>
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
          </View>
        ) : null}

        {/* ── History ── */}
        <View style={section}>
          <Text variant="eyebrow" tone="textMuted" accessibilityRole="header">
            {t('bet.history.title')}
          </Text>
          {history.length === 0 ? (
            <Text tone="textMuted">{t('bet.history.empty')}</Text>
          ) : (
            history.map((b, i) => (
              <View
                key={b.id}
                testID={`bet-history-${b.id}`}
                style={{
                  gap: space.xs,
                  paddingVertical: space.sm,
                  ...(i > 0 && {
                    borderTopWidth: borderWidth.hairline,
                    borderTopColor: colors.border,
                  }),
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="data" tabular>
                    {b.amountPln} zł
                  </Text>
                  <Text
                    variant="eyebrow"
                    color={b.status === 'won' ? colors.urgency.done.fg : colors.urgency.act_now.fg}
                  >
                    {t(`bet.history.${b.status}`)}
                  </Text>
                </View>
                <Text variant="caption" tone="textMuted">
                  {longDate(b.createdAt)} — {longDate(b.expiresAt)}
                </Text>
                <Text>
                  {b.status === 'won'
                    ? t('bet.history.wonMessage')
                    : t('bet.history.lostMessage', { amount: b.amountPln })}
                </Text>
              </View>
            ))
          )}
        </View>

        <Disclaimer text={t('bet.disclaimer')} />
      </Plate>
    </Screen>
  );
}
