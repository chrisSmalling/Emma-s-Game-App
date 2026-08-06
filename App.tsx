import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable, Animated, Dimensions, Modal, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
const MAX_ROUNDS = 5;
const HIT_SIZE = 64; // minimum hit size

type ItemState = {
  id: number;
  counted: boolean;
  anim: Animated.Value;
};

// Bundled audio map — these files are placeholders in assets/audio/
const AUDIO_MAP: Record<string, any> = {
  '1': require('./assets/audio/1.mp3'),
  '2': require('./assets/audio/2.mp3'),
  '3': require('./assets/audio/3.mp3'),
  '4': require('./assets/audio/4.mp3'),
  '5': require('./assets/audio/5.mp3'),
  total: require('./assets/audio/total.mp3'),
  prompt: require('./assets/audio/prompt.mp3'),
};

export default function App() {
  const [round, setRound] = useState(1);
  const [items, setItems] = useState<ItemState[]>([]);
  const [countedCount, setCountedCount] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [highest, setHighest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initRound(round);
    (async () => {
      try {
        const v = await AsyncStorage.getItem('highestCountReached');
        if (v) setHighest(Number(v));
      } catch (e) {
        console.warn('AsyncStorage load failed', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (countedCount === items.length && items.length > 0) {
      onRoundComplete();
    }
  }, [countedCount, items]);

  function initRound(n: number) {
    const arr: ItemState[] = Array.from({ length: n }, (_, i) => ({ id: i, counted: false, anim: new Animated.Value(0) }));
    setItems(arr);
    setCountedCount(0);
    setShowCongrats(false);
  }

  async function playBundledClip(name: string): Promise<boolean> {
    // Try to play a bundled clip. Return true if playback started, false to indicate fallback.
    try {
      const module = AUDIO_MAP[name];
      if (!module) return false;
      const { sound } = await Audio.Sound.createAsync(module, { shouldPlay: true });
      // Let it play and then unload
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
      return true;
    } catch (e) {
      // Playback failed — likely because placeholder clip isn't a real audio file on device
      console.warn('Bundled audio playback failed for', name, e);
      return false;
    }
  }

  async function playNumber(n: number) {
    const name = String(n);
    const played = await playBundledClip(name);
    if (!played) {
      // Fallback to system TTS
      Speech.speak(String(n), { pitch: 1.0, rate: 0.9 });
    }
  }

  function onTapItem(index: number) {
    setItems(prev => {
      const next = prev.map((it, i) => {
        if (i === index) {
          if (!it.counted) {
            // animate bounce + glow
            Animated.sequence([
              Animated.timing(it.anim, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.timing(it.anim, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
            setCountedCount(c => c + 1);
            playNumber(index + 1);
            return { ...it, counted: true };
          } else {
            // re-say number
            playNumber(index + 1);
            return it;
          }
        }
        return it;
      });
      return next;
    });
  }

  async function onRoundComplete() {
    // Cardinality moment: restate total and a brief celebration
    setShowCongrats(true);
    const total = items.length;

    // Try to play a short celebration + restatement using bundled clips. If either fails, fall back to TTS.
    const playedTotal = await playBundledClip('total');
    if (!playedTotal) {
      // Short chime + restatement via TTS
      Speech.speak('Yay!', { pitch: 1.2, rate: 1.0 });
      setTimeout(() => {
        Speech.speak(`${total} ducks!`);
      }, 600);
    } else {
      // After total clip, play prompt clip (if available)
      setTimeout(async () => {
        const playedPrompt = await playBundledClip('prompt');
        if (!playedPrompt) {
          Speech.speak('Now count your fingers!');
        }
      }, 900);
    }

    try {
      const newHighest = Math.max(highest, total);
      setHighest(newHighest);
      await AsyncStorage.setItem('highestCountReached', String(newHighest));
    } catch (e) {
      console.warn('AsyncStorage save failed', e);
    }
  }

  function onNextRound() {
    if (round < MAX_ROUNDS) {
      setRound(r => r + 1);
      initRound(round + 1);
    } else {
      // natural stopping point after ~5 rounds
      Alert.alert('Great counting!', 'You completed the session. Tap Next to play again or close the app.');
      setRound(1);
      initRound(1);
    }
  }

  // Parent gate: press-and-hold the small lock in top-right for 2s
  function onParentGatePressIn() {
    holdTimer.current = setTimeout(() => setSettingsOpen(true), 2000);
  }
  function onParentGatePressOut() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  const itemViews = items.map((it, i) => {
    const scale = it.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
    return (
      <Pressable key={it.id} onPress={() => onTapItem(i)} style={{ margin: 8 }}>
        <Animated.View
          style={[
            styles.item,
            { transform: [{ scale }], borderColor: it.counted ? '#ffcc00' : '#333' },
            it.counted ? styles.countedGlow : null,
          ]}
        >
          <Text style={styles.emoji}>🦆</Text>
        </Animated.View>
      </Pressable>
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text accessible accessibilityRole="header" style={styles.title}>Count with me!</Text>
        <Pressable onPressIn={onParentGatePressIn} onPressOut={onParentGatePressOut} accessibilityLabel="Parent settings">
          <View style={styles.lock}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.scene}>
        <Text accessibilityElementsHidden>{/* decorative */}</Text>
        <View style={styles.itemsRow}>
          {itemViews}
        </View>
      </View>

      {showCongrats && (
        <View style={styles.congrats} pointerEvents="none">
          <Text style={styles.congratsText}>🎉</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.prompt}>Round {round} — Tap each duck once</Text>
        <Pressable onPress={onNextRound} style={styles.nextButton} accessibilityLabel="Next round">
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      <Modal visible={settingsOpen} animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.settings}>
          <Text style={styles.settingsTitle}>Settings (placeholder)</Text>
          <Text style={styles.settingsNote}>Parent-gated placeholder. Nothing to configure in v1.</Text>
          <Pressable onPress={() => setSettingsOpen(false)} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '600' },
  lock: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  scene: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: width - 40 },
  item: { width: HIT_SIZE, height: HIT_SIZE, borderRadius: HIT_SIZE / 2, backgroundColor: '#f0f8ff', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  emoji: { fontSize: 28 },
  countedGlow: { shadowColor: '#ffcc00', shadowRadius: 8, shadowOpacity: 0.9, elevation: 6 },
  congrats: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' },
  congratsText: { fontSize: 64 },
  footer: { padding: 20, alignItems: 'center' },
  prompt: { marginBottom: 12, fontSize: 18 },
  nextButton: { backgroundColor: '#2b8aef', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  nextText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  settings: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  settingsTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  settingsNote: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  closeButton: { backgroundColor: '#2b8aef', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  closeText: { color: '#fff', fontSize: 16 }
});
