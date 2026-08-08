import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useLetterIntroduction from '../../hooks/useLetterIntroduction';
import THEME from '../../constants/theme';
import { LETTERS_COPLAY_HINT } from '../../constants/content';
import OceanBackground from '../OceanBackground';
import ParentGate from '../ParentGate';
import SettingsScreen from '../SettingsScreen';
import LetterCard from './LetterCard';
import { ActivityId } from '../../constants/activities';

type Props = {
  activityId: ActivityId;
  onSelectActivity: (id: ActivityId) => void;
};

// Stage A / L1 (LETTERS-VERTICAL-BRIEF.md §2): recognition + sound. One
// letter at a time, tap to hear its phoneme and reveal its picture cue, a
// calm "Next" control to advance — pure exposure, no quiz, no score. All
// the rotation logic (SATPIN order, revisiting learned letters before a new
// one) lives in useLetterIntroduction; this component just renders it.
export default function LettersHome({ activityId, onSelectActivity }: Props) {
  const { letter, revealed, handleLetterPress, handleNext } = useLetterIntroduction();
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBand}>
        <Text style={styles.title}>Letters</Text>
        <ParentGate onUnlock={() => setSettingsVisible(true)} />
      </View>

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

      <SettingsScreen
        visible={settingsVisible}
        activityId={activityId}
        onSelectActivity={onSelectActivity}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.surfaceWater },
  topBand: {
    height: 72,
    paddingHorizontal: THEME.SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.midWater,
  },
  title: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, color: '#fff' },
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
