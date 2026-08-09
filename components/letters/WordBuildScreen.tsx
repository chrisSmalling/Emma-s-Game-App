import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import useWordBuilding from '../../hooks/useWordBuilding';
import THEME from '../../constants/theme';
import { WORD_BUILD_COPLAY_HINT } from '../../constants/content';
import OceanBackground from '../OceanBackground';
import WordSlot from './WordSlot';
import WordTile from './WordTile';
import WordCelebration from './WordCelebration';

// Stage L3 (LETTERS-VERTICAL-BRIEF.md — word building / blending): a
// picture + empty slots show the goal, the word's own letters appear
// scrambled as big tappable tiles, and the child fills the slots in order.
// No distractors, no fail state — a tap on a not-yet-expected letter just
// plays that letter's own sound in place and waits, never blocking
// progress. All the round/placement/completion logic lives in
// useWordBuilding; this component only renders it.
//
// The word prompt is tap-to-replay rather than auto-playing on mount —
// same reasoning SoundMatchScreen documents: a round appearing isn't a
// user gesture, so browsers block audio there.
export default function WordBuildScreen() {
  const { letters, word, scrambled, placedCount, placedTileIndices, activeTileIndex, tapPhase, roundPhase, playPrompt, handleTilePress } =
    useWordBuilding();

  return (
    <>
      <View style={styles.scene}>
        <OceanBackground />
        {word ? (
          <>
            <Pressable
              onPress={playPrompt}
              accessibilityRole="button"
              accessibilityLabel={`Play the word ${word.word}`}
              style={styles.promptCard}
            >
              <Text style={styles.promptEmoji}>{word.pictureCue.emoji}</Text>
              <Text style={styles.promptText}>Let&rsquo;s build {word.word}!</Text>
            </Pressable>

            <View style={styles.slotsRow}>
              {word.letters.map((letterId, i) => (
                <WordSlot key={i} letter={i < placedCount ? letters[letterId] : null} />
              ))}
            </View>

            <View style={styles.trayRow}>
              {scrambled.map(
                (letterId, i) =>
                  !placedTileIndices.includes(i) && (
                    <WordTile
                      key={i}
                      letter={letters[letterId]}
                      highlight={activeTileIndex === i ? tapPhase : 'none'}
                      disabled={tapPhase !== 'idle' || roundPhase !== 'building'}
                      onPress={() => handleTilePress(i)}
                    />
                  )
              )}
            </View>

            {roundPhase === 'celebrating' && <WordCelebration word={word.word} />}
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.comingSoon}>More words coming soon!</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomBand}>
        <Text style={styles.coplay}>{WORD_BUILD_COPLAY_HINT}</Text>
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
    paddingVertical: THEME.SPACING.l,
    paddingHorizontal: THEME.SPACING.xxl,
    alignItems: 'center',
    zIndex: 1,
    marginBottom: THEME.SPACING.xl,
  },
  promptEmoji: { fontSize: 56 },
  promptText: {
    fontSize: THEME.TYPE.body,
    fontFamily: THEME.TYPE.fontFamilyBold,
    color: THEME.COLORS.deepWater,
    marginTop: THEME.SPACING.s,
    textAlign: 'center',
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    marginBottom: THEME.SPACING.xl,
  },
  trayRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  bottomBand: {
    minHeight: 84,
    padding: THEME.SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.sand,
  },
  coplay: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#5b4a2f' },
});
