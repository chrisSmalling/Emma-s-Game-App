import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';

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
  const scale = useRef(new Animated.Value(1)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -8, duration: 1500 + index * 120, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1500 + index * 120, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, index]);

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, ...THEME.MOTION.spring }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...THEME.MOTION.spring }),
    ]).start();
    onPress();
  }

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
      <Animated.View style={[styles.fish, { transform: [{ translateY: bob }, { scale }] }, counted && styles.counted]}>
        <Image source={src} style={styles.image} resizeMode="contain" />
        {counted && order != null && (
          <View style={styles.numberBubble}>
            <Text style={styles.numberText}>{order}</Text>
          </View>
        )}
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
    borderColor: THEME.COLORS.countedGlow,
    shadowColor: THEME.COLORS.countedGlow,
    shadowRadius: 10,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  numberBubble: {
    position: 'absolute',
    top: -14,
    right: -6,
    backgroundColor: THEME.COLORS.countedGlow,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  numberText: { color: '#fff', fontFamily: THEME.TYPE.fontFamilyBold, fontSize: 14 },
});
