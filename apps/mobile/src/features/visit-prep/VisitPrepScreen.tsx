import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { buildVisitPrepHtml } from './build-visit-prep-html';
import { formatDatePl } from './format-date';
import { PrepSection } from './PrepSection';
import { PrimaryButton } from './PrimaryButton';
import { shareVisitPrepPdf } from './share-visit-prep';
import { useVisitPrep } from './use-visit-prep';

export default function VisitPrepScreen() {
  const { colors, layout, space, type } = useTheme();
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

  const body = [type.body, { color: colors.text }];
  const muted = [type.body, { color: colors.textMuted }];
  const items = (lines: string[], empty: string) =>
    lines.length ? (
      lines.map((line) => (
        <Text key={line} style={body}>
          {`• ${line}`}
        </Text>
      ))
    ) : (
      <Text style={muted}>{empty}</Text>
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingHorizontal: layout.screenPaddingX,
        paddingVertical: layout.sectionGap,
        gap: layout.cardGap,
        width: '100%',
        maxWidth: layout.maxContentWidth,
        alignSelf: 'center',
      }}
    >
      <View style={{ gap: space.xs }}>
        <Text accessibilityRole="header" style={[type.title, { color: colors.text }]}>
          {summary.person.name}
        </Text>
        <Text style={[type.bodyLarge, { color: colors.text }]}>
          {t('visitPrep.person.details', {
            age: summary.person.age,
            sex: summary.person.sexLabel,
          })}
        </Text>
        <Text style={muted}>{t('visitPrep.intro')}</Text>
      </View>

      <PrepSection title={t('visitPrep.sections.riskFactors')}>
        {items(summary.riskFactors, t('visitPrep.empty.riskFactors'))}
      </PrepSection>

      <PrepSection title={t('visitPrep.sections.askForReferral')}>
        {items(
          summary.askForReferral.map((x) => `${x.name} — ${x.reason}`),
          t('visitPrep.empty.askForReferral'),
        )}
      </PrepSection>

      <PrepSection title={t('visitPrep.sections.noReferralNeeded')}>
        {items(
          summary.noReferralNeeded.map((x) =>
            x.referralNote ? `${x.name} — ${x.referralNote}` : x.name,
          ),
          t('visitPrep.empty.noReferralNeeded'),
        )}
      </PrepSection>

      <PrepSection title={t('visitPrep.sections.recentlyDone')}>
        {items(
          summary.recentlyDone.map(
            (x) => `${x.name} — ${t('visitPrep.doneOn', { date: formatDatePl(x.date) })}`,
          ),
          t('visitPrep.empty.recentlyDone'),
        )}
      </PrepSection>

      <PrepSection title={t('visitPrep.sections.questions')}>
        {summary.questions.map((q, i) => (
          <Text key={q} style={body}>
            {`${i + 1}. ${q}`}
          </Text>
        ))}
      </PrepSection>

      <PrimaryButton
        label={busy ? t('visitPrep.share.busy') : t('visitPrep.share.button')}
        hint={t('visitPrep.share.hint')}
        busy={busy}
        onPress={() => void onShare()}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: colors.danger }]}>
          {t('visitPrep.share.error')}
        </Text>
      ) : null}
    </ScrollView>
  );
}
