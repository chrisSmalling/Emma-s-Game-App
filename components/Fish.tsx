import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Image } from 'react-native';
import THEME from '../constants/theme';
import { FISH_ORANGE, FISH_PINK, FISH_YELLOW } from '../assets/generated/placeholders';

type Props = {
  index: number;
  counted: boolean;
  order: number | null;
  onPress: () => void;
};

const FISH_SRCS = [FISH_ORANGE, FISH_PINK, FISH_YELLOW];

export default function Fish({ index, counted, order, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -6, duration: 1600, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.25, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  }

  const src = FISH_SRCS[index % FISH_SRCS.length];

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={counted && order ? `Fish ${order}, counted` : `Fish`} accessibilityHint="Tap to hear the number" hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}>
      <Animated.View style={[styles.fish, { transform: [{ translateY: bob }, { scale }] }, counted ? styles.counted : null]}>
        <Image source={{ uri: src }} style={styles.image} resizeMode="contain" />
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
  fish: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', margin: 10, borderWidth: 2, borderColor: '#ddd' },
  image: { width: 72, height: 72 },
  counted: { shadowColor: THEME.COLORS.countedGlow, shadowRadius: 8, shadowOpacity: 0.9, elevation: 6, borderColor: THEME.COLORS.countedGlow },
  numberBubble: { position: 'absolute', top: -18, backgroundColor: THEME.COLORS.countedGlow, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  numberText: { color: '#fff', fontWeight: '800' as any, fontFamily: THEME.TYPE.fontFamily },
});
