import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { buildVisitPrepHtml } from './build-visit-prep-html';
import { formatDatePl } from './format-date';
import { shareVisitPrepPdf } from './share-visit-prep';
import { useVisitPrep } from './use-visit-prep';

import type { ReactNode } from 'react';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </Card>
  );
}

function Lines({ lines, empty }: { lines: string[]; empty: string }) {
  if (!lines.length) return <Text tone="textMuted">{empty}</Text>;
  return lines.map((line) => <Text key={line}>{`• ${line}`}</Text>);
}

export default function VisitPrepScreen() {
  const { space } = useTheme();
  const { summary, today } = useVisitPrep();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

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
      <View style={{ gap: space.xs }}>
        <Text variant="title" accessibilityRole="header">
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
          <Text key={q}>{`${i + 1}. ${q}`}</Text>
        ))}
      </Section>
    </Screen>
  );
}
