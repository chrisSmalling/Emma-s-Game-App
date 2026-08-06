import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Easing } from 'react-native';
import THEME from '../constants/theme';

type Props = {
  index: number;
  counted: boolean;
  order: number | null;
  onPress: () => void;
};

export default function Fish({ index, counted, order, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -6, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function handlePress() {
    // press spring
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, friction: 4, tension: 120 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }),
    ]).start();
    onPress();
  }

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={counted && order ? `Fish ${order}, counted` : `Fish`} accessibilityHint="Tap to hear the number" hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}>
      <Animated.View style={[styles.fish, { transform: [{ translateY: bob }, { scale }] }, counted ? styles.counted : null]}>
        <Text style={styles.emoji}>🐠</Text>
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
  fish: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', margin: 10, borderWidth: 2, borderColor: '#ddd' },
  emoji: { fontSize: 36 },
  counted: { shadowColor: THEME.COLORS.countedGlow, shadowRadius: 8, shadowOpacity: 0.9, elevation: 6, borderColor: THEME.COLORS.countedGlow },
  numberBubble: { position: 'absolute', top: -18, backgroundColor: THEME.COLORS.countedGlow, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  numberText: { color: '#fff', fontWeight: '800' as any, fontFamily: THEME.TYPE.fontFamily },
});
