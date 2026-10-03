import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { buildVisitPrepHtml } from './build-visit-prep-html';
import { formatDatePl } from './format-date';
import { shareVisitPrepPdf } from './share-visit-prep';
import { useVisitPrep } from './use-visit-prep';

import type { ReactNode } from 'react';

/** Section on the plate: ink rule + mono eyebrow, no card (redesign v2 §4). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, space, borderWidth } = useTheme();
  return (
    <View
      style={{
        gap: space.xs,
        paddingTop: space.md,
        borderTopWidth: borderWidth.strong,
        borderTopColor: colors.text,
      }}
    >
      <Text variant="eyebrow" tone="textMuted" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Items as list rows with hairline separators instead of bullets. */
function Lines({ lines, empty }: { lines: string[]; empty: string }) {
  const { colors, space, borderWidth } = useTheme();
  if (!lines.length) return <Text tone="textMuted">{empty}</Text>;
  return lines.map((line, i) => (
    <Text
      key={line}
      style={{
        paddingVertical: space.sm,
        ...(i > 0 && { borderTopWidth: borderWidth.hairline, borderTopColor: colors.border }),
      }}
    >
      {line}
    </Text>
  ));
}

export default function VisitPrepScreen() {
  const { space, colors, type } = useTheme();
  const data = useVisitPrep();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!data) {
    return (
      <Screen wall edges={['left', 'right', 'bottom']}>
        <Plate>
          <EmptyState
            icon="people"
            title={t('visitPrep.noProfile.title')}
            body={t('visitPrep.noProfile.body')}
            action={{
              label: t('visitPrep.noProfile.cta'),
              onPress: () => router.push('/onboarding/welcome'),
            }}
          />
        </Plate>
      </Screen>
    );
  }
  const { summary, today } = data;

  const onShare = async () => {
    setBusy(true);
    setError(false);
    try {
      await shareVisitPrepPdf(buildVisitPrepHtml(summary, today));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      wall
      // The stack header already covers the top inset.
      edges={['left', 'right', 'bottom']}
      footer={
        <>
          <Button
            label={t('visitPrep.share.button')}
            accessibilityHint={t('visitPrep.share.hint')}
            loading={busy}
            fullWidth
            onPress={() => void onShare()}
          />
          {error && (
            <Text tone="danger" accessibilityRole="alert">
              {t('visitPrep.share.error')}
            </Text>
          )}
        </>
      }
    >
      <Plate>
        <View style={{ gap: space.xs }}>
          <Text variant="display" accessibilityRole="header">
            {summary.person.name}
          </Text>
          <Text variant="bodyLarge">
            {t('visitPrep.person.details', {
              age: summary.person.age,
              sex: summary.person.sexLabel,
            })}
          </Text>
          <Text tone="textMuted">{t('visitPrep.intro')}</Text>
        </View>

        <Section title={t('visitPrep.sections.riskFactors')}>
          <Lines lines={summary.riskFactors} empty={t('visitPrep.empty.riskFactors')} />
        </Section>

        <Section title={t('visitPrep.sections.askForReferral')}>
          <Lines
            lines={summary.askForReferral.map((x) => `${x.name} — ${x.reason}`)}
            empty={t('visitPrep.empty.askForReferral')}
          />
        </Section>

        <Section title={t('visitPrep.sections.noReferralNeeded')}>
          <Lines
            lines={summary.noReferralNeeded.map((x) =>
              x.referralNote ? `${x.name} — ${x.referralNote}` : x.name,
            )}
            empty={t('visitPrep.empty.noReferralNeeded')}
          />
        </Section>

        <Section title={t('visitPrep.sections.recentlyDone')}>
          <Lines
            lines={summary.recentlyDone.map(
              (x) => `${x.name} — ${t('visitPrep.doneOn', { date: formatDatePl(x.date) })}`,
            )}
            empty={t('visitPrep.empty.recentlyDone')}
          />
        </Section>

        <Section title={t('visitPrep.sections.questions')}>
          {summary.questions.map((q, i) => (
            <View
              key={q}
              style={{ flexDirection: 'row', gap: space.sm, paddingVertical: space.xs }}
            >
              <Text tabular color={colors.primary} style={{ fontFamily: type.data.fontFamily }}>
                {`${i + 1}.`}
              </Text>
              <Text style={{ flex: 1 }}>{q}</Text>
            </View>
          ))}
        </Section>
      </Plate>
    </Screen>
  );
}
