import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import THEME from '../constants/theme';

const DOT_COUNT = 6;
const TRAVEL = 34;
const DURATION = 480;

type DotProps = {
  angle: number;
  progress: SharedValue<number>;
};

function BurstDot({ angle, progress }: DotProps) {
  const style = useAnimatedStyle(() => {
    const dist = progress.value * TRAVEL;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(angle) * dist },
        { translateY: Math.sin(angle) * dist },
        { scale: 1 - progress.value * 0.4 },
      ],
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

// A quick, self-contained sparkle burst localized to the tapped object —
// distinct from the ambient background bubbles, so each individual tap gets
// its own small "wow" right where the child's finger is, on top of the
// spring pop + wiggle + number. Fires once on mount and fades out; a new
// tap remounts this with a fresh key (see TappableObject), so React just
// discards the old burst rather than needing explicit cleanup.
export default function TapBurst() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) });
  }, [progress]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <BurstDot key={i} angle={(i / DOT_COUNT) * Math.PI * 2} progress={progress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 10,
    height: 10,
    marginTop: -5,
    marginLeft: -5,
    borderRadius: 5,
    backgroundColor: THEME.COLORS.celebration,
  },
});
