import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useLetters from '../../hooks/useLetters';
import THEME from '../../constants/theme';
import OceanBackground from '../OceanBackground';
import ParentGate from '../ParentGate';
import SettingsScreen from '../SettingsScreen';
import { ActivityId } from '../../constants/activities';

type Props = {
  activityId: ActivityId;
  onSelectActivity: (id: ActivityId) => void;
};

// Stage L0 placeholder (LETTERS-VERTICAL-BRIEF.md): proves the Letters
// activity is wired up end to end — real data model, real progress hook,
// real entry point — with no tap interaction yet. Stage A's actual
// recognition + sound screen lands in L1.
export default function LettersHome({ activityId, onSelectActivity }: Props) {
  const { content, currentLetterId } = useLetters();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const letter = currentLetterId ? content.letters[currentLetterId] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBand}>
        <Text style={styles.title}>Letters</Text>
        <ParentGate onUnlock={() => setSettingsVisible(true)} />
      </View>

      <View style={styles.scene}>
        <OceanBackground />
        <View style={styles.card}>
          {letter ? (
            <>
              <Text style={styles.letterGlyph}>{letter.display}</Text>
              <Text style={styles.cue}>
                {letter.pictureCue.emoji} {letter.pictureCue.word}
              </Text>
              <Text style={styles.comingSoon}>Coming soon!</Text>
            </>
          ) : (
            <Text style={styles.comingSoon}>All letters learned — more coming soon!</Text>
          )}
        </View>
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
  scene: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: THEME.SPACING.xxl,
    paddingHorizontal: THEME.SPACING.xxl,
    alignItems: 'center',
    zIndex: 1,
  },
  letterGlyph: { fontSize: 96, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.deepWater },
  cue: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamily, color: THEME.COLORS.deepWater, marginTop: THEME.SPACING.m },
  comingSoon: { fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.accent, marginTop: THEME.SPACING.l },
});
