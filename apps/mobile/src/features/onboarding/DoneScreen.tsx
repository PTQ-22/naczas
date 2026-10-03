import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { Button, Icon, Plate, Screen, Text } from '@/components';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

export default function DoneScreen() {
  const { colors, layout, motion, radius } = useTheme();
  const badge = layout.icon.lg * 2;

  return (
    <Screen
      wall
      footer={
        <Button
          label={t('onboarding.done.cta')}
          onPress={() => router.replace('/plan')}
          fullWidth
        />
      }
    >
      <Plate>
        {/* Short, decorative entrance; ReduceMotion.System skips it when the OS asks for less. */}
        <Animated.View
          entering={ZoomIn.duration(motion.base).reduceMotion(ReduceMotion.System)}
          style={{ alignSelf: 'flex-start' }}
        >
          <View
            style={{
              width: badge,
              height: badge,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primarySoft,
            }}
          >
            <Icon name="check" size="lg" color={colors.primary} />
          </View>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(motion.base)
            .delay(motion.fast)
            .reduceMotion(ReduceMotion.System)}
        >
          <Text variant="display" accessibilityRole="header">
            {t('onboarding.done.title')}
          </Text>
          <Text variant="bodyLarge">{t('onboarding.done.subtitle')}</Text>
        </Animated.View>
      </Plate>
    </Screen>
  );
}
