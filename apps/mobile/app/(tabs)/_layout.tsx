import { Tabs } from 'expo-router';

import { t } from '@/i18n';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="plan" options={{ title: t('common.tabs.plan') }} />
      <Tabs.Screen name="family" options={{ title: t('common.tabs.family') }} />
      <Tabs.Screen name="settings" options={{ title: t('common.tabs.settings') }} />
    </Tabs>
  );
}
