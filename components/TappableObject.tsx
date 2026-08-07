import React, { ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import THEME from '../constants/theme';
import CountBubble from './CountBubble';

type Props = {
  index: number;
  counted: boolean;
  order: number | null;
  onPress: () => void;
  // Singular, capitalized noun for the accessibility label, e.g. "Fish", "Shape".
  objectLabel: string;
  // The visual to render inside the tappable circle — an Image, an SVG shape, etc.
  children: ReactNode;
};

// Shared idle-bob + spring-tap + counted-glow + number-bubble behavior for
// any countable object. Subject-specific components (Fish, Shape, ...)
// supply their own visual as `children` and wrap this.
export default function TappableObject({ index, counted, order, onPress, objectLabel, children }: Props) {
  const scale = useSharedValue(1);
  const bob = useSharedValue(0);

  useEffect(() => {
    const duration = 1500 + index * 120;
    bob.value = withRepeat(
      withSequence(withTiming(-8, { duration }), withTiming(0, { duration })),
      -1,
      false
    );
    // bob is a stable shared value ref; only re-run this when the object's
    // own idle-bob timing offset (index) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handlePress() {
    scale.value = withSequence(
      withSpring(1.25, THEME.MOTION.spring),
      withSpring(1, THEME.MOTION.spring)
    );
    onPress();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scale: scale.value }],
  }));

  const label = counted && order != null ? `${objectLabel}, counted number ${order}` : `${objectLabel}, not yet counted`;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Tap to hear the number"
      accessibilityState={{ selected: counted }}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      style={styles.hitArea}
    >
      <Animated.View style={[styles.object, animatedStyle, counted && styles.counted]}>
        {children}
        {counted && order != null && <CountBubble order={order} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: { margin: THEME.SPACING.s },
  object: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  counted: {
    borderColor: THEME.COLORS.counted,
    shadowColor: THEME.COLORS.counted,
    shadowRadius: 10,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
