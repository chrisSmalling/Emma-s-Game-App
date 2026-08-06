import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, View, StyleSheet } from 'react-native';

type ConfettiProps = {
  trigger: boolean;
  burstCount?: number;
  duration?: number; // ms
};

const { width, height } = Dimensions.get('window');
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#B388EB'];

export default function Confetti({ trigger, burstCount = 20, duration = 900 }: ConfettiProps) {
  const [pieces, setPieces] = useState<number[]>([]);
  const anims = useRef<{
    translateY: Animated.Value;
    translateX: Animated.Value;
    rotate: Animated.Value;
    opacity: Animated.Value;
  }[]>([]);

  useEffect(() => {
    if (!trigger) return;

    // create pieces
    const ids = Array.from({ length: burstCount }, (_, i) => i);
    setPieces(ids);

    anims.current = ids.map(() => ({
      translateY: new Animated.Value(-20),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }));

    // start animations
    const animations = anims.current.map((a, i) => {
      const fall = Animated.timing(a.translateY, { toValue: height * 0.6 + Math.random() * 80, duration, useNativeDriver: true });
      const drift = Animated.timing(a.translateX, { toValue: (Math.random() - 0.5) * width * 0.6, duration, useNativeDriver: true });
      const rot = Animated.timing(a.rotate, { toValue: Math.random() * 360, duration, useNativeDriver: true });
      const fade = Animated.timing(a.opacity, { toValue: 0, duration, useNativeDriver: true });
      return Animated.parallel([Animated.delay(i * (duration / burstCount / 2)), Animated.parallel([fall, drift, rot, fade])]);
    });

    Animated.stagger(8, animations).start(() => {
      // cleanup after animation
      setTimeout(() => setPieces([]), 200);
    });

  }, [trigger, burstCount, duration]);

  if (pieces.length === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const a = anims.current[i];
        if (!a) return null;
        const left = Math.random() * (width - 24) + 12;
        const size = 8 + Math.round(Math.random() * 12);
        const bg = COLORS[i % COLORS.length];
        const rotate = a.rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left,
              top: 0,
              width: size,
              height: size * 1.2,
              borderRadius: 3,
              backgroundColor: bg,
              transform: [
                { translateY: a.translateY },
                { translateX: a.translateX },
                { rotate },
              ],
              opacity: a.opacity,
            }}
          />
        );
      })}
    </View>
  );
}
