import { useState } from 'react';
import { View } from 'react-native';

import { t } from '@/i18n';
import { useTheme, useThemePreferences } from '@/theme';

import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { ChipGroup } from './ChipGroup';
import { Disclaimer } from './Disclaimer';
import { EmptyState } from './EmptyState';
import { OptionTile } from './OptionTile';
import { ProfileSwitcher } from './ProfileSwitcher';
import { ProgressBar } from './ProgressBar';
import { Screen } from './Screen';
import { Text } from './Text';
import { TextField } from './TextField';

const noop = () => undefined;

/** Dev-only gallery (/dev/components) for quick visual review in senior + dark mode. */
export function ComponentGallery() {
  const prefs = useThemePreferences();
  const { space } = useTheme();
  const [multi, setMulti] = useState<string[]>(['a']);
  const [active, setActive] = useState('me');
  const [year, setYear] = useState('');
  const [lastExam, setLastExam] = useState<'a' | 'b' | 'c' | undefined>('a');
  const chipOptions = [
    { value: 'a', label: t('common.dev.chipA') },
    { value: 'b', label: t('common.dev.chipB') },
    { value: 'c', label: t('common.dev.chipC') },
  ] as const;
  const toggle = (id: string) =>
    setMulti((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('common.dev.galleryTitle')}
      </Text>
      <OptionTile
        mode="checkbox"
        label={t('common.dev.senior')}
        selected={prefs.seniorMode}
        onPress={() => prefs.setSeniorMode(!prefs.seniorMode)}
      />
      <OptionTile
        mode="checkbox"
        label={t('common.dev.dark')}
        selected={prefs.darkMode === 'dark'}
        onPress={() => prefs.setDarkMode(prefs.darkMode === 'dark' ? 'light' : 'dark')}
      />

      <Text variant="display">{t('common.dev.sample')}</Text>
      <Text variant="heading">{t('common.dev.sample')}</Text>
      <Text>{t('common.dev.sampleLong')}</Text>
      <Text variant="caption" tone="textSubtle">
        {t('common.dev.sample')}
      </Text>

      <Button label={t('common.dev.primary')} onPress={noop} fullWidth />
      <Button label={t('common.dev.secondary')} variant="secondary" onPress={noop} />
      <Button label={t('common.dev.ghost')} variant="ghost" icon="external" onPress={noop} />
      <Button label={t('common.dev.primary')} loading onPress={noop} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Chip tone="act_now" icon="alert" label={t('plan.urgency.act_now')} />
        <Chip tone="this_year" icon="calendar" label={t('plan.urgency.this_year')} />
        <Chip tone="later" icon="time" label={t('plan.urgency.later')} />
        <Chip tone="booked" icon="booked" label={t('plan.urgency.booked')} />
        <Chip tone="done" icon="check" label={t('plan.urgency.done')} />
        <Chip tone="done" dot label={t('plan.card.waitWeeks', { weeks: 2 })} />
      </View>

      <ProgressBar
        value={5 / 7}
        accessibilityLabel={t('common.components.progress', { current: 5, total: 7 })}
      />

      <ProfileSwitcher
        profiles={[
          { id: 'me', name: t('common.dev.profileMe'), urgentCount: 0 },
          { id: 'mama', name: t('common.dev.profileMama'), urgentCount: 2 },
        ]}
        activeId={active}
        onSelect={setActive}
        onAdd={noop}
      />

      <OptionTile
        mode="checkbox"
        label={t('common.dev.optionA')}
        selected={multi.includes('a')}
        onPress={() => toggle('a')}
      />
      <OptionTile
        mode="checkbox"
        label={t('common.dev.optionB')}
        selected={multi.includes('b')}
        onPress={() => toggle('b')}
      />

      <TextField
        label={t('common.dev.fieldLabel')}
        value={year}
        onChangeText={setYear}
        hint={t('common.dev.fieldHint')}
        error={year && !/^\d{4}$/.test(year) ? t('common.dev.fieldError') : null}
        keyboardType="number-pad"
        maxLength={4}
      />
      <ChipGroup
        groupLabel={t('common.dev.chipsLabel')}
        options={chipOptions}
        selected={lastExam}
        onSelect={setLastExam}
      />

      <Card>
        <Text variant="heading">{t('common.dev.sample')}</Text>
        <Text tone="textMuted">{t('common.dev.sampleLong')}</Text>
      </Card>

      <EmptyState title={t('common.dev.emptyTitle')} body={t('common.dev.emptyBody')} />
      <Disclaimer text={t('common.dev.disclaimer')} onMore={noop} />
    </Screen>
  );
}
