import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
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
};

const FISH_SOURCES = [
  require('../assets/fish/kenney/fish_orange.png'),
  require('../assets/fish/kenney/fish_pink.png'),
  require('../assets/fish/kenney/fish_blue.png'),
  require('../assets/fish/kenney/fish_green.png'),
];

export default function Fish({ index, counted, order, onPress }: Props) {
  const scale = useSharedValue(1);
  const bob = useSharedValue(0);

  useEffect(() => {
    const duration = 1500 + index * 120;
    bob.value = withRepeat(
      withSequence(withTiming(-8, { duration }), withTiming(0, { duration })),
      -1,
      false
    );
    // bob is a stable shared value ref; only re-run this when the fish's
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

  const src = FISH_SOURCES[index % FISH_SOURCES.length];
  const label = counted && order != null ? `Fish, counted number ${order}` : 'Fish, not yet counted';

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
      <Animated.View style={[styles.fish, animatedStyle, counted && styles.counted]}>
        <Image source={src} style={styles.image} resizeMode="contain" />
        {counted && order != null && <CountBubble order={order} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: { margin: THEME.SPACING.s },
  fish: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  image: { width: 68, height: 68 },
  counted: {
    borderColor: THEME.COLORS.counted,
    shadowColor: THEME.COLORS.counted,
    shadowRadius: 10,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
