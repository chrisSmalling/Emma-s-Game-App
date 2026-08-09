import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import useSoundMatch from '../../hooks/useSoundMatch';
import THEME from '../../constants/theme';
import { SOUND_MATCH_COPLAY_HINT } from '../../constants/content';
import OceanBackground from '../OceanBackground';
import SoundMatchTile from './SoundMatchTile';

// Stage B / L2 (LETTERS-VERTICAL-BRIEF.md §2 Stage B, §4): the app plays a
// sound, 2-3 already-learned letters are shown, the child taps one. Correct
// taps celebrate and auto-advance to a new round; a non-target tap is pure
// exploration — the tapped letter just says its own sound, then the app
// re-invites toward the target on the same round. No quiz chrome, no score,
// no "wrong" state anywhere. All the round/feedback logic lives in
// useSoundMatch; this component just renders it.
export default function SoundMatchScreen() {
  const { letters, round, phase, tappedId, playTarget, handleOptionPress } = useSoundMatch();

  return (
    <>
      <View style={styles.scene}>
        <OceanBackground />
        {round ? (
          <>
            <Pressable
              onPress={playTarget}
              accessibilityRole="button"
              accessibilityLabel="Play the sound again"
              style={styles.promptCard}
            >
              <Text style={styles.promptEmoji}>🔊</Text>
              <Text style={styles.promptText}>Which letter says this sound?</Text>
            </Pressable>

            <View style={styles.optionsRow}>
              {round.optionIds.map(id => (
                <SoundMatchTile
                  key={id}
                  letter={letters[id]}
                  highlight={tappedId === id ? phase : 'none'}
                  disabled={phase !== 'idle'}
                  onPress={() => handleOptionPress(id)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.comingSoon}>Learn a few more letters in Practice first!</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomBand}>
        <Text style={styles.coplay}>{SOUND_MATCH_COPLAY_HINT}</Text>
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
  comingSoon: { fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.accent, textAlign: 'center' },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: THEME.SPACING.xl,
    paddingHorizontal: THEME.SPACING.xxl,
    alignItems: 'center',
    zIndex: 1,
    marginBottom: THEME.SPACING.xl,
  },
  promptEmoji: { fontSize: 48 },
  promptText: {
    fontSize: THEME.TYPE.body,
    fontFamily: THEME.TYPE.fontFamilyBold,
    color: THEME.COLORS.deepWater,
    marginTop: THEME.SPACING.s,
    textAlign: 'center',
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  bottomBand: {
    minHeight: 84,
    padding: THEME.SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.sand,
  },
  coplay: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#5b4a2f' },
});
