import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import THEME from '../constants/theme';

type Props = {
  order: number;
};

// The number-in-a-bubble that appears above a fish once it's been counted.
// Pops in with a little overshoot rather than just appearing flat — part of
// making the counting moment itself feel more rewarding.
export default function CountBubble({ order }: Props) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1, THEME.MOTION.spring)
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.bubble, animatedStyle]}>
      <Text style={styles.text}>{order}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    top: -14,
    right: -6,
    backgroundColor: THEME.COLORS.counted,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  text: { color: '#fff', fontFamily: THEME.TYPE.fontFamilyBold, fontSize: 14 },
});
