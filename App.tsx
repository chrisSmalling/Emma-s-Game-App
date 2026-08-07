import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fredoka_400Regular, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

import useCounting from './hooks/useCounting';
import useSound from './hooks/useSound';
import OceanBackground from './components/OceanBackground';
import Fish from './components/Fish';
import CelebrationOverlay from './components/CelebrationOverlay';
import SessionComplete from './components/SessionComplete';
import ParentGate from './components/ParentGate';
import SettingsScreen from './components/SettingsScreen';
import THEME from './constants/theme';
import { bridgePromptForRound, COPLAY_HINT, NOUN } from './constants/content';

function Game() {
  const {
    round,
    roundsPerSession,
    items,
    countedCount,
    phase,
    highestCountReached,
    level,
    levelId,
    setLevel,
    tapItem,
    nextRound,
    restartSession,
  } = useCounting();
  const sound = useSound();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  useEffect(() => {
    if (phase === 'roundComplete') {
      if (level.emphasizeCardinality) {
        // Cardinality-emphasis levels ask the question before answering it,
        // leaning harder into "the last number counted is the total".
        sound.speak('How many fish are there?');
        const askThenAnswer = setTimeout(() => sound.playTotal(round, NOUN), 1300);
        const t = setTimeout(() => sound.speak(bridgePromptForRound(round)), 1300 + 1700);
        return () => {
          clearTimeout(askThenAnswer);
          clearTimeout(t);
        };
      }
      sound.playTotal(round, NOUN);
      const t = setTimeout(() => sound.speak(bridgePromptForRound(round)), 1600);
      return () => clearTimeout(t);
    }
    if (phase === 'sessionComplete') {
      sound.speak('Great counting today!');
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, level.emphasizeCardinality]);

  if (!fontsLoaded) return null;

  function handleTap(index: number) {
    const result = tapItem(index);
    if (!result || result.assignedOrder == null) return;
    sound.triggerHaptic();
    sound.playNumber(result.assignedOrder);
  }

  if (phase === 'roundComplete') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <CelebrationOverlay
          total={round}
          bridgePrompt={bridgePromptForRound(round)}
          isLastRound={round >= roundsPerSession}
          onNext={nextRound}
        />
      </View>
    );
  }

  if (phase === 'sessionComplete') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <SessionComplete highestCountReached={highestCountReached} onPlayAgain={restartSession} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.topBand}>
        <View style={styles.topBandLeft}>
          <Text style={styles.title}>Count the fish!</Text>
          <Text style={styles.roundLabel}>Round {round} of {roundsPerSession}</Text>
        </View>
        <View style={styles.topBandRight}>
          <View style={styles.countBadge} accessibilityRole="header">
            <Text style={styles.countBadgeText}>{countedCount}</Text>
          </View>
          <ParentGate onUnlock={() => setSettingsVisible(true)} />
        </View>
      </View>

      <View style={styles.scene}>
        <OceanBackground />
        <View style={styles.fishRow}>
          {items.map((it, i) => (
            <Fish key={it.id} index={i} counted={it.counted} order={it.order} onPress={() => handleTap(i)} />
          ))}
        </View>
      </View>

      <View style={styles.bottomBand}>
        <Text style={styles.prompt}>Tap each fish once to count it</Text>
        <Text style={styles.coplay}>{COPLAY_HINT}</Text>
      </View>

      <SettingsScreen
        visible={settingsVisible}
        highestCountReached={highestCountReached}
        levelId={levelId}
        onSelectLevel={setLevel}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
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
  topBandLeft: { flexShrink: 1 },
  topBandRight: { flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.m },
  title: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, color: '#fff' },
  roundLabel: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: 'rgba(255,255,255,0.85)' },
  countBadge: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.COLORS.celebration,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countBadgeText: { fontSize: 22, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.deepWater },
  scene: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fishRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', paddingHorizontal: THEME.SPACING.l, zIndex: 1 },
  bottomBand: {
    minHeight: 84,
    padding: THEME.SPACING.l,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.sand,
  },
  prompt: { fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.deepWater },
  coplay: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#5b4a2f', marginTop: 4 },
});
