import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import THEME from '../../constants/theme';
import { LetterEntry } from '../../constants/letters.en';

type Props = {
  letter: LetterEntry;
  revealed: boolean;
  onPress: () => void;
};

// Stage A's visual hero (LETTERS-VERTICAL-BRIEF.md): the letter itself —
// large, high-contrast, unmistakable. One calm spring reaction per tap,
// never an escalating or busy effect. The picture cue is reserved a fixed
// slot below so revealing it doesn't shift the letter.
export default function LetterCard({ letter, revealed, onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(withSpring(1.12, THEME.MOTION.spring), withSpring(1, THEME.MOTION.spring));
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Letter ${letter.display}`}
      accessibilityHint="Tap to hear its sound"
      style={styles.card}
    >
      <Animated.View style={animatedStyle}>
        <Text style={styles.glyph}>{letter.display}</Text>
      </Animated.View>
      <View style={styles.cueSlot}>
        {revealed && (
          <Text style={styles.cue}>
            {letter.pictureCue.emoji} {letter.pictureCue.word}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: THEME.SPACING.xxl,
    paddingHorizontal: THEME.SPACING.xxl,
    alignItems: 'center',
    zIndex: 1,
  },
  glyph: { fontSize: 140, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.deepWater },
  cueSlot: { height: THEME.TYPE.title + THEME.SPACING.l, marginTop: THEME.SPACING.m, justifyContent: 'center' },
  cue: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamily, color: THEME.COLORS.deepWater },
});
