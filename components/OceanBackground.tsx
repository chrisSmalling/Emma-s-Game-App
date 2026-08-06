import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import THEME from '../constants/theme';

const SAND_TILE = require('../assets/ocean/terrain_sand_top_a.png');
const ROCK = require('../assets/ocean/background_rock_a.png');
const SEAWEED = [
  require('../assets/ocean/seaweed_green_a.png'),
  require('../assets/ocean/seaweed_pink_a.png'),
  require('../assets/ocean/seaweed_orange_a.png'),
];
const BUBBLES = [
  require('../assets/ocean/bubble_a.png'),
  require('../assets/ocean/bubble_b.png'),
  require('../assets/ocean/bubble_c.png'),
];

const SAND_HEIGHT = 56;
const TILE_SIZE = 56;

function Seaweed({ source, left, delay }: { source: any; left: number; delay: number }) {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(sway, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 1800, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, sway]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.Image
      source={source}
      style={[
        styles.seaweed,
        { left, transform: [{ rotate }] },
      ]}
      resizeMode="contain"
    />
  );
}

function Bubble({ source, left, delay, duration }: { source: any; left: number; delay: number; duration: number }) {
  const rise = useRef(new Animated.Value(0)).current;
  const { height } = useWindowDimensions();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(rise, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, rise]);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [0, -(height + 80)] });
  const translateX = rise.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 12, -6] });
  const opacity = rise.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.85, 0.85, 0] });

  return (
    <Animated.View style={[styles.bubbleGlow, { left, opacity, transform: [{ translateY }, { translateX }] }]}>
      <Image source={source} style={styles.bubble} resizeMode="contain" />
    </Animated.View>
  );
}

export default function OceanBackground() {
  const { width } = useWindowDimensions();
  const tileCount = Math.ceil(width / TILE_SIZE) + 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[THEME.COLORS.surfaceWater, THEME.COLORS.midWater, THEME.COLORS.deepWater]}
        style={StyleSheet.absoluteFill}
      />

      {[10, 45, 78, 110, 150].map((left, i) => (
        <Bubble
          key={`bubble-${i}`}
          source={BUBBLES[i % BUBBLES.length]}
          left={left}
          delay={i * 900}
          duration={5200 + i * 400}
        />
      ))}

      <View style={styles.floor}>
        <View style={styles.sandRow}>
          {Array.from({ length: tileCount }).map((_, i) => (
            <Image key={i} source={SAND_TILE} style={styles.sandTile} resizeMode="cover" />
          ))}
        </View>
        <Image source={ROCK} style={[styles.rock, { left: width * 0.12 }]} resizeMode="contain" />
        <Image source={ROCK} style={[styles.rock, { left: width * 0.72, width: 34, height: 34 }]} resizeMode="contain" />
        <Seaweed source={SEAWEED[0]} left={width * 0.22} delay={0} />
        <Seaweed source={SEAWEED[1]} left={width * 0.5} delay={400} />
        <Seaweed source={SEAWEED[2]} left={width * 0.82} delay={800} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: SAND_HEIGHT + 44 },
  sandRow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: SAND_HEIGHT, flexDirection: 'row' },
  sandTile: { width: TILE_SIZE, height: SAND_HEIGHT },
  rock: { position: 'absolute', bottom: SAND_HEIGHT - 6, width: 44, height: 44 },
  seaweed: { position: 'absolute', bottom: SAND_HEIGHT - 4, width: 40, height: 44 },
  bubbleGlow: {
    position: 'absolute',
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { width: 18, height: 18 },
});
