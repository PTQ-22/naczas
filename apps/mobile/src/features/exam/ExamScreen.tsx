import { router, useLocalSearchParams } from 'expo-router';
import { Linking, View } from 'react-native';
import { z } from 'zod';

import { rules } from '@naczas/rules';

import { Accordion } from '@/components/Accordion';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Disclaimer } from '@/components/Disclaimer';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { urgencyIcon } from '@/features/plan/ExamCard';
import { usePlanData } from '@/features/plan/use-plan-data';
import { t } from '@/i18n';
import { useRecordsStore } from '@/store';
import { useTheme } from '@/theme';

import {
  examCtas,
  frequencyMessage,
  queueInfo,
  referralText,
  timingMessages,
  type ExamAction,
  type Message,
} from './exam-view-model';

import type { ReactNode } from 'react';

const msg = (m: Message) => t(m.key, m.params);

// URL params are external input (AGENTS.md §3): validate before touching rules.
const ParamsSchema = z.object({ examId: z.string().min(1) });

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function ExamScreen() {
  const theme = useTheme();
  const { colors, space, layout, radius } = theme;
  const params = ParamsSchema.safeParse(useLocalSearchParams());
  const { activeProfile, plan, waitTimes, today } = usePlanData();
  const upsertRecord = useRecordsStore((s) => s.upsertRecord);

  const examId = params.success ? params.data.examId : undefined;
  const rule = rules.find((r) => r.id === examId);

  if (!rule) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState icon="info" title={t('exam.notFound.title')} body={t('exam.notFound.body')} />
      </Screen>
    );
  }

  const item = plan?.items.find((i) => i.examId === rule.id);
  const queue = queueInfo(rule, waitTimes[rule.id]);
  const ctas = examCtas(rule, item);
  const referral = referralText(rule);
  const palette = item ? colors.urgency[item.urgency] : undefined;

  const run = (action: ExamAction) => {
    switch (action) {
      case 'facilities':
        router.push({ pathname: '/exam/[examId]/facilities', params: { examId: rule.id } });
        return;
      case 'program':
        if (rule.programUrl) void Linking.openURL(rule.programUrl);
        else router.push({ pathname: '/exam/[examId]/facilities', params: { examId: rule.id } });
        return;
      case 'book':
        router.push({ pathname: '/exam/[examId]/book', params: { examId: rule.id } });
        return;
      case 'markDone':
        // TODO(WS3-5): switch to markDone() from the records store when it lands (adds undo).
        if (!activeProfile) return;
        upsertRecord({
          profileId: activeProfile.id,
          examId: rule.id,
          status: 'done',
          lastDone: today,
          updatedAt: today,
        });
        router.back();
    }
  };

  const { primary, ghost } = ctas;
  const footer =
    primary || ghost ? (
      <>
        {primary && (
          <Button label={msg(primary.label)} onPress={() => run(primary.action)} fullWidth />
        )}
        {ghost && (
          <Button
            variant="ghost"
            label={msg(ghost.label)}
            onPress={() => run(ghost.action)}
            fullWidth
          />
        )}
      </>
    ) : undefined;

  return (
    <Screen edges={['left', 'right']} footer={footer}>
      <View style={{ gap: space.sm }}>
        {item && (
          <Chip
            tone={item.urgency}
            icon={urgencyIcon[item.urgency]}
            label={t(`plan.urgency.${item.urgency}`)}
          />
        )}
        <Text variant="title" accessibilityRole="header">
          {rule.name}
        </Text>
        {item &&
          timingMessages(item, today).map((m, i) => (
            <Text key={m.key} variant="bodyLarge" color={i === 1 ? palette?.fg : undefined}>
              {msg(m)}
            </Text>
          ))}
      </View>

      {queue && (
        <View
          accessible
          style={{
            gap: space.xs,
            padding: layout.cardPadding,
            borderRadius: radius.lg,
            backgroundColor: queue.hasData
              ? (palette?.bg ?? colors.primarySoft)
              : colors.surfaceAlt,
          }}
        >
          {queue.lines.label && <Text>{msg(queue.lines.label)}</Text>}
          {queue.lines.value && <Text variant="heading">{msg(queue.lines.value)}</Text>}
          {queue.lines.meta && (
            <Text variant="caption" tone="textSubtle">
              {msg(queue.lines.meta)}
            </Text>
          )}
        </View>
      )}

      {item && item.reasons.length > 0 && (
        <Section title={t('exam.section.why')}>
          {item.reasons.map((reason) => (
            <Text key={reason}>{`• ${reason}`}</Text>
          ))}
        </Section>
      )}

      <Section title={t('exam.section.about')}>
        <Text>{rule.description}</Text>
      </Section>

      <Section title={t('exam.section.frequency')}>
        <Text>{msg(frequencyMessage(rule.intervalMonths))}</Text>
        {!rule.verified && <Chip tone="later" icon="info" label={t('exam.approximate')} />}
      </Section>

      <Section title={t('exam.section.referral')}>
        <Text>{typeof referral === 'string' ? referral : msg(referral)}</Text>
        {rule.referral && (
          <Button
            variant="ghost"
            icon="chevronRight"
            label={t('exam.referral.prepareRequest')}
            onPress={() => router.push('/visit-prep')}
          />
        )}
      </Section>

      {rule.prepTips && rule.prepTips.length > 0 && (
        <Accordion title={t('exam.section.prep')}>
          {rule.prepTips.map((tip) => (
            <Text key={tip}>{`• ${tip}`}</Text>
          ))}
        </Accordion>
      )}

      <Button
        variant="ghost"
        icon="external"
        accessibilityRole="link"
        label={t('exam.source', { name: rule.source.name })}
        accessibilityLabel={t('exam.sourceA11y', { name: rule.source.name })}
        onPress={() => void Linking.openURL(rule.source.url)}
      />

      <Disclaimer text={t('exam.disclaimer')} />
    </Screen>
  );
}
