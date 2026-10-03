import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { colors, type, layout, space } = useTheme();
  const insets = useSafeAreaInsets();
  // The default 49 pt bar clips a 14 pt (senior: 18 pt) label; size it from tokens instead.
  const tabBarHeight = layout.minTouch + type.caption.lineHeight + space.sm * 2 + insets.bottom;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingTop: space.sm,
          paddingBottom: space.sm + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: type.caption.fontSize,
          lineHeight: type.caption.lineHeight,
          fontWeight: type.label.fontWeight,
        },
        headerStyle: { backgroundColor: colors.surface },
        // Default separator is a light hairline that glares in dark mode; surface vs bg is enough.
        headerShadowVisible: false,
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
        name="bet"
        options={{
          title: t('bet.tabs.bet'),
          tabBarAccessibilityLabel: t('bet.tabs.bet'),
          tabBarIcon: tabIcon('trophy'),
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
