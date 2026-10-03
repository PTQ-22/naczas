import { Tabs } from 'expo-router';

import { t } from '@/i18n';

// TODO(WS4): tab icons + colors from theme tokens (no icon library installed yet).
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="plan"
        options={{ title: t('common.tabs.plan'), tabBarAccessibilityLabel: t('common.tabs.plan') }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: t('common.tabs.family'),
          tabBarAccessibilityLabel: t('common.tabs.family'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common.tabs.settings'),
          tabBarAccessibilityLabel: t('common.tabs.settings'),
        }}
      />
    </Tabs>
  );
}
