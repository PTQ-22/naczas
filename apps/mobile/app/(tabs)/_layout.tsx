import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/Icon';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import type { ColorValue } from 'react-native';

function tabIcon(name: IconName) {
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} color={color} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { colors, type } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: type.caption.fontSize, fontWeight: type.label.fontWeight },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: t('common.tabs.plan'),
          tabBarAccessibilityLabel: t('common.tabs.plan'),
          tabBarIcon: tabIcon('calendar'),
          // Plan renders its own title + profile switcher; a native header would duplicate it.
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: t('common.tabs.family'),
          tabBarAccessibilityLabel: t('common.tabs.family'),
          tabBarIcon: tabIcon('people'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common.tabs.settings'),
          tabBarAccessibilityLabel: t('common.tabs.settings'),
          tabBarIcon: tabIcon('settings'),
        }}
      />
    </Tabs>
  );
}
