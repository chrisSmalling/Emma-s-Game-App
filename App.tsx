import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_700Bold, Fredoka_800ExtraBold } from '@expo-google-fonts/fredoka';
import useCounting from './hooks/useCounting';
import useSound from './hooks/useSound';
import OceanBackground from './components/OceanBackground';
import Fish from './components/Fish';
import CelebrationOverlay from './components/CelebrationOverlay';
import THEME from './constants/theme';

export default function App() {
  const { items, countedCount, initRound, onTapIndex, isRoundComplete } = useCounting(1);
  const sound = useSound();

  useEffect(() => {
    initRound(1);
  }, []);

  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_700Bold,
    Fredoka_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  function handleTap(index: number) {
    const res = onTapIndex(index);
    if (!res) return;
    const { assignedOrder, isNew } = res as { assignedOrder: number | null; isNew: boolean };
    if (assignedOrder == null) return;

    // Side-effects: play number, sfx, haptic. Animations handled in Fish.
    sound.playSfx('confetti'); // small pop
    sound.triggerHaptic();
    sound.playNumber(assignedOrder);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.topBand}>
        <Text style={styles.title}>Count the fish!</Text>
        <Text accessibilityRole="header" style={styles.runningCount}>{countedCount}</Text>
      </View>

      {isRoundComplete() ? (
        <Modal visible animationType="slide">
          <CelebrationOverlay
            total={items.length}
            onContinue={() => {
              // reset to next round
              const next = Math.min(items.length + 1, 5);
              initRound(next);
            }}
          />
        </Modal>
      ) : (
        <View style={styles.scene}>
          <OceanBackground />
          <View style={styles.fishRow}>
            {items.map((it, i) => (
              <Fish
                key={it.id}
                index={i}
                counted={it.counted}
                order={it.order ?? null}
                onPress={() => handleTap(i)}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.bottomBand}>
        <Text style={styles.prompt}>Round — Tap each fish once</Text>
        <Pressable onPress={() => initRound(1)} style={styles.nextButton} accessibilityRole="button">
          <Text style={styles.nextText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.surfaceWater },
  topBand: { height: 80, paddingTop: 36, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamily, color: '#fff', fontWeight: '700' as any },
  runningCount: { fontSize: 28, fontFamily: THEME.TYPE.fontFamily, color: '#fff', fontWeight: '800' as any },
  scene: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fishRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  bottomBand: { height: 120, padding: 20, alignItems: 'center', backgroundColor: THEME.COLORS.sandyFloor },
  prompt: { marginBottom: 12, fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamily },
  nextButton: { backgroundColor: THEME.COLORS.accent, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  nextText: { color: '#fff', fontSize: 18, fontFamily: THEME.TYPE.fontFamily },
});
