import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const NUM_PARTICLES = 40;
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// We use the brand colors for confetti
const COLORS = ['#1C6B66', '#A12F1B', '#F2C063', '#4D69B5', '#5DB476'];

export function Confetti({ fire }: { fire: boolean }) {
  if (!fire) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
      {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </Animated.View>
  );
}

function Particle({ index }: { index: number }) {
  const progress = useSharedValue(0);

  const [config] = React.useState(() => {
    return {
      // Start in the bottom center
      startX: windowWidth / 2,
      // Explode outwards horizontally
      endX: windowWidth / 2 + (Math.random() - 0.5) * windowWidth * 1.5,
      // Start near the middle-bottom
      startY: windowHeight * 0.6,
      // How high it shoots up
      peakY: windowHeight * 0.3 + Math.random() * 200,
      delay: Math.random() * 200,
      duration: 1200 + Math.random() * 800,
      color: COLORS[index % COLORS.length],
      rotations: 1 + Math.random() * 4,
    };
  });

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(config.delay, withTiming(1, { duration: config.duration }));
  }, [config, progress]);

  const style = useAnimatedStyle(() => {
    // Parabolic trajectory
    const x = config.startX + (config.endX - config.startX) * progress.value;
    // Goes up to peak, then falls down
    const y =
      config.startY -
      Math.sin(progress.value * Math.PI) * config.peakY +
      progress.value * windowHeight * 0.5;

    return {
      position: 'absolute',
      left: x,
      top: y,
      width: 12,
      height: 12,
      borderRadius: 3,
      backgroundColor: config.color,
      transform: [
        { rotate: `${progress.value * 360 * config.rotations}deg` },
        { scale: 1 - progress.value * 0.3 },
      ],
      opacity: 1 - Math.pow(progress.value, 4), // fade out at the very end
    };
  });

  return <Animated.View style={style} />;
}
