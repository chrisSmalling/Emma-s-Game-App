import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import useLetterIntroduction from '../../hooks/useLetterIntroduction';
import THEME from '../../constants/theme';
import { LETTERS_COPLAY_HINT } from '../../constants/content';
import OceanBackground from '../OceanBackground';
import LetterCard from './LetterCard';

// Stage A / L1 (LETTERS-VERTICAL-BRIEF.md §2): recognition + sound. One
// letter at a time, tap to hear its phoneme and reveal its picture cue, a
// calm "Next" control to advance — pure exposure, no quiz, no score. All
// the rotation logic (SATPIN order, revisiting learned letters before a new
// one) lives in useLetterIntroduction; this component just renders it.
export default function PracticeScreen() {
  const { letter, revealed, handleLetterPress, handleNext } = useLetterIntroduction();

  return (
    <>
      <View style={styles.scene}>
        <OceanBackground />
        {letter ? (
          <LetterCard letter={letter} revealed={revealed} onPress={handleLetterPress} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.comingSoon}>More letters coming soon!</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomBand}>
        <Pressable
          onPress={handleNext}
          disabled={!letter}
          style={[styles.nextButton, !letter && styles.nextButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Next letter"
        >
          <Text style={styles.nextButtonText}>Next letter</Text>
        </Pressable>
        <Text style={styles.coplay}>{LETTERS_COPLAY_HINT}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: THEME.SPACING.xxl,
    paddingHorizontal: THEME.SPACING.xxl,
    alignItems: 'center',
    zIndex: 1,
  },
  comingSoon: { fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.accent },
  bottomBand: {
    minHeight: 84,
    padding: THEME.SPACING.l,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.sand,
  },
  nextButton: { backgroundColor: THEME.COLORS.accent, paddingHorizontal: THEME.SPACING.xxl, paddingVertical: THEME.SPACING.m, borderRadius: 16 },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: '#fff', fontSize: 18, fontFamily: THEME.TYPE.fontFamilyBold },
  coplay: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#5b4a2f', marginTop: THEME.SPACING.s },
});
