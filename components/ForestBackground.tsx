import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import THEME from '../constants/theme';

// Benny's cozy forest — the character-first slice's world. Code-drawn (same
// "code, not assets" approach OceanBackground already uses for its
// gradient/bubbles), warm and calm rather than busy: a soft gradient sky,
// a few simple round tree silhouettes, and gentle sway — nowhere near as
// much ambient motion as the ocean's bubbles, since "warm, not busy" is the
// whole point of this world.

function Tree({ left, scale, delay }: { left: number; scale: number; delay: number }) {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(sway, { toValue: 1, duration: 3400, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 3400, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 3400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, sway]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });

  return (
    <Animated.View style={[styles.tree, { left, transform: [{ scale }, { rotate }] }]}>
      <Svg width={90} height={130} viewBox="0 0 90 130">
        <Path d="M 45 130 L 38 78 L 52 78 Z" fill={THEME.COLORS.forestFloor} />
        <Circle cx={45} cy={70} r={34} fill={THEME.COLORS.forestCanopy} />
        <Circle cx={22} cy={50} r={22} fill={THEME.COLORS.forestCanopy} />
        <Circle cx={68} cy={50} r={22} fill={THEME.COLORS.forestCanopy} />
        <Circle cx={45} cy={38} r={24} fill={THEME.COLORS.forestCanopy} />
      </Svg>
    </Animated.View>
  );
}

function Sunbeam({ left, delay, duration }: { left: number; delay: number; duration: number }) {
  const drift = useRef(new Animated.Value(0)).current;
  const { height } = useWindowDimensions();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(drift, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, drift]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.6] });
  const opacity = drift.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.5, 0.5, 0] });

  return <Animated.View style={[styles.sunbeam, { left, opacity, transform: [{ translateY }] }]} />;
}

export default function ForestBackground() {
  const { width } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[THEME.COLORS.forestSky, THEME.COLORS.forestCanopy, THEME.COLORS.forestDeep]}
        style={StyleSheet.absoluteFill}
      />

      {[width * 0.15, width * 0.55, width * 0.85].map((left, i) => (
        <Sunbeam key={`beam-${i}`} left={left} delay={i * 1400} duration={7000 + i * 600} />
      ))}

      <View style={styles.floor}>
        <Tree left={width * 0.06} scale={0.85} delay={0} />
        <Tree left={width * 0.68} scale={1} delay={500} />
        <Tree left={width * 0.36} scale={0.7} delay={950} />
      </View>

      <View style={styles.ground} />
    </View>
  );
}

const styles = StyleSheet.create({
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 170 },
  tree: { position: 'absolute', bottom: 0 },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    backgroundColor: THEME.COLORS.forestFloor,
    opacity: 0.55,
  },
  sunbeam: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 90,
    backgroundColor: THEME.COLORS.forestGlow,
    borderRadius: 2,
  },
});
