import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Disclaimer, OptionTile, Plate, Screen, Text } from '@/components';
import { AccountSection } from '@/features/auth/AccountSection';
import { DefaultFacilityCard } from '@/features/facilities/DefaultFacilityCard';
import { t } from '@/i18n';
import {
  cancelAllOurNotifications,
  notifyContent,
  sendTestNotification,
  type TestNotificationResult,
} from '@/notifications';
import { usePlan } from '@/services';
import {
  DISCLOSURE_FIELDS,
  resetAllData,
  resolveToday,
  useProfilesStore,
  useSettingsStore,
  useToday,
} from '@/store';
import { PALETTE_IDS, usePaletteStore, useTheme, type DarkModePreference } from '@/theme';

import { applyDemoPreset, DEMO_PRESETS } from './demo-presets';
import { LocationSection } from './LocationSection';
import { SettingsSection } from './SettingsSection';
import { ToggleRow } from './ToggleRow';

const DARK_MODES: readonly DarkModePreference[] = ['system', 'light', 'dark'];

const longDate = (date: string) => format(parseISO(date), 'd MMMM yyyy', { locale: pl });

function testResultText(result: TestNotificationResult, title: string): string {
  switch (result) {
    case 'sent':
      return t('settings.demo.testResult.sent');
    case 'in-app':
    case 'unsupported':
      return t('settings.demo.testResult.inApp', { title });
    case 'denied':
      return t('settings.demo.testResult.denied');
    case 'undetermined':
      return t('settings.demo.testResult.undetermined');
  }
}

export default function SettingsScreen() {
  const { space } = useTheme();
  const seniorMode = useSettingsStore((s) => s.seniorMode);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const todayOverride = useSettingsStore((s) => s.todayOverride);
  const setSeniorMode = useSettingsStore((s) => s.setSeniorMode);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const palette = usePaletteStore((s) => s.palette);
  const setPalette = usePaletteStore((s) => s.setPalette);
  const setTodayOverride = useSettingsStore((s) => s.setTodayOverride);
  const callDisclosure = useSettingsStore((s) => s.callDisclosure);
  const setCallDisclosure = useSettingsStore((s) => s.setCallDisclosure);
  const activeProfile = useProfilesStore((s) => s.profiles.find((p) => p.id === s.activeProfileId));
  const today = useToday();
  const { plan } = usePlan(activeProfile?.id ?? '');

  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const onTestNotification = async () => {
    // Demo: show the most urgent real reminder of the active person, if there is one.
    const urgent = plan?.items.find((i) => i.urgency === 'act_now') ?? plan?.items[0];
    const content =
      urgent && activeProfile
        ? notifyContent(urgent.examId, activeProfile.name, urgent.dueDate)
        : undefined;
    setSending(true);
    try {
      const result = await sendTestNotification(content);
      setTestStatus(
        testResultText(result, content?.title ?? t('settings.notifications.testTitle')),
      );
    } finally {
      setSending(false);
    }
  };

  const onReset = async () => {
    // Pending reminders name exams and people — they go together with the data.
    await cancelAllOurNotifications().catch(() => 0);
    resetAllData();
    setConfirmReset(false);
    router.replace('/');
  };

  return (
    <Screen wall edges={['left', 'right']}>
      <Plate>
        <SettingsSection first title={t('settings.display.header')}>
          <ToggleRow
            testID="settings-senior"
            label={t('settings.display.seniorMode')}
            hint={t('settings.display.seniorModeHint')}
            value={seniorMode}
            onChange={setSeniorMode}
          />
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('settings.display.darkMode')}
            style={{ gap: space.xs }}
          >
            <Text variant="label">{t('settings.display.darkMode')}</Text>
            {DARK_MODES.map((mode) => (
              <OptionTile
                key={mode}
                testID={`settings-dark-${mode}`}
                mode="radio"
                label={t(`settings.display.darkModeOptions.${mode}`)}
                selected={darkMode === mode}
                onPress={() => setDarkMode(mode)}
              />
            ))}
          </View>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('settings.display.palette')}
            style={{ gap: space.xs }}
          >
            <Text variant="label">{t('settings.display.palette')}</Text>
            {PALETTE_IDS.map((id) => (
              <OptionTile
                key={id}
                testID={`settings-palette-${id}`}
                mode="radio"
                label={t(`settings.display.paletteOptions.${id}`)}
                selected={palette === id}
                onPress={() => setPalette(id)}
              />
            ))}
          </View>
        </SettingsSection>

        <SettingsSection title={t('settings.defaultFacility.header')}>
          <DefaultFacilityCard showTitle={false} />
        </SettingsSection>

        {activeProfile ? <LocationSection profile={activeProfile} /> : null}

        <SettingsSection title={t('settings.demo.header')}>
          <Text tone="textMuted">{t('settings.demo.todayOverrideHint')}</Text>
          <Text variant="label" accessibilityLiveRegion="polite" testID="settings-demo-date">
            {todayOverride
              ? t('settings.demo.current', { date: longDate(today) })
              : `${t('settings.demo.todayOverride')}: ${t('settings.demo.todayOverrideOff')}`}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {DEMO_PRESETS.map((preset) => (
              <Button
                key={preset}
                testID={`settings-demo-${preset}`}
                variant="secondary"
                label={t(`settings.demo.presets.${preset}`)}
                accessibilityLabel={t(`settings.demo.presetA11y.${preset}`)}
                onPress={() =>
                  setTodayOverride(applyDemoPreset(preset, today, resolveToday(null, new Date())))
                }
              />
            ))}
          </View>
          <Button
            testID="settings-test-notification"
            variant="secondary"
            icon="time"
            label={t('settings.demo.testNotification')}
            loading={sending}
            onPress={() => void onTestNotification()}
            fullWidth
          />
          {testStatus ? (
            <Text accessibilityLiveRegion="polite" tone="textMuted" testID="settings-test-status">
              {testStatus}
            </Text>
          ) : null}
        </SettingsSection>

        <SettingsSection title={t('settings.privacy.header')}>
          <Text>{t('settings.privacy.body')}</Text>
        </SettingsSection>

        <SettingsSection title={t('settings.callDisclosure.header')}>
          <Text tone="textMuted">{t('settings.callDisclosure.intro')}</Text>
          {DISCLOSURE_FIELDS.map((field) => (
            <ToggleRow
              key={field}
              testID={`settings-disclosure-${field}`}
              label={t(`settings.callDisclosure.fields.${field}`)}
              {...(field === 'pesel' && { hint: t('settings.callDisclosure.hints.pesel') })}
              value={callDisclosure[field]}
              onChange={(allowed) => setCallDisclosure(field, allowed)}
            />
          ))}
        </SettingsSection>

        <SettingsSection title={t('auth.title')}>
          <AccountSection />
        </SettingsSection>

        <SettingsSection title={t('settings.data.header')}>
          {confirmReset ? (
            <View accessibilityRole="alert" style={{ gap: space.sm }}>
              <Text variant="label">{t('settings.data.resetConfirmTitle')}</Text>
              <Text>{t('settings.data.resetConfirmBody')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                <Button
                  testID="settings-reset-confirm"
                  label={t('settings.data.resetConfirm')}
                  accessibilityLabel={t('settings.data.resetConfirmA11y')}
                  onPress={() => void onReset()}
                />
                <Button
                  testID="settings-reset-cancel"
                  variant="ghost"
                  label={t('settings.data.cancel')}
                  onPress={() => setConfirmReset(false)}
                />
              </View>
            </View>
          ) : (
            <Button
              testID="settings-reset"
              variant="secondary"
              icon="alert"
              label={t('settings.data.reset')}
              onPress={() => setConfirmReset(true)}
            />
          )}
        </SettingsSection>

        <Disclaimer text={t('settings.disclaimer')} />
      </Plate>
    </Screen>
  );
}
