import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import THEME from '../constants/theme';

const HOLD_MS = 1200;

type Props = {
  onUnlock: () => void;
};

export default function ParentGate({ onUnlock }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  }

  function startHold() {
    Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      onUnlock();
      clear();
    }, HOLD_MS);
  }

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  return (
    <Pressable
      onPressIn={startHold}
      onPressOut={clear}
      accessibilityRole="button"
      accessibilityLabel="Parent settings"
      accessibilityHint="Press and hold for two seconds to open grown-up settings"
      style={styles.button}
      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
    >
      <Animated.View style={[styles.dot, { transform: [{ scale }] }]}>
        <Text style={styles.icon}>⚙</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 16, color: '#fff', fontFamily: THEME.TYPE.fontFamily },
});
