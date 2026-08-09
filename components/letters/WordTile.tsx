import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import THEME from '../../constants/theme';
import { LetterEntry } from '../../constants/letters.en';
import { TapPhase } from '../../hooks/useWordBuilding';
import TapBurst from '../TapBurst';

type Props = {
  letter: LetterEntry;
  // 'none' for every tile except the one just tapped, which gets the phase
  // it triggered — see hooks/useWordBuilding.ts. A not-yet-expected tap
  // (exploring) gets the exact same gentle reaction as the correct one,
  // nothing lesser — there is no "wrong" styling anywhere in this vertical.
  highlight: 'none' | TapPhase;
  disabled: boolean;
  onPress: () => void;
};

// A scrambled letter tile in Stage L3's tray. Deliberately its own
// component rather than reusing SoundMatchTile — same visual language, but
// L3's tap semantics (guided left-to-right placement, tiles that leave the
// tray once placed) are different enough to keep separate, and L2 stays
// untouched.
export default function WordTile({ letter, highlight, disabled, onPress }: Props) {
  const scale = useSharedValue(1);
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    if (highlight === 'correct') {
      scale.value = withSequence(withSpring(1.25, THEME.MOTION.spring), withSpring(1, THEME.MOTION.spring));
      setBurstId(id => id + 1);
    } else if (highlight === 'exploring') {
      scale.value = withSequence(withSpring(1.12, THEME.MOTION.spring), withSpring(1, THEME.MOTION.spring));
    }
  }, [highlight, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Letter ${letter.display}`}
      style={styles.hitArea}
    >
      <Animated.View style={[styles.tile, animatedStyle, highlight === 'correct' && styles.correct]}>
        <Text style={styles.glyph}>{letter.display}</Text>
        {burstId > 0 && highlight === 'correct' && <TapBurst key={burstId} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: { margin: THEME.SPACING.s },
  tile: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  correct: {
    borderColor: THEME.COLORS.counted,
    shadowColor: THEME.COLORS.counted,
    shadowRadius: 10,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  glyph: { fontSize: 48, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.deepWater },
});
