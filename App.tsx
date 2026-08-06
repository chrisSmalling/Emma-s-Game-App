import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable, Animated, Dimensions, Modal, Alert, AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Confetti from './components/Confetti';

const { width } = Dimensions.get('window');
const MAX_ROUNDS = 5;
const HIT_SIZE = 64; // minimum hit size

type ItemState = {
  id: number;
  counted: boolean;
  anim: Animated.Value;
  order?: number | null; // assigned counting order once tapped
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
  confetti: require('./assets/audio/confetti.mp3'),
};

export default function App() {
  const [round, setRound] = useState(1);
  const [items, setItems] = useState<ItemState[]>([]);
  const [countedCount, setCountedCount] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [highest, setHighest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedSounds = useRef<Record<string, Audio.Sound | null>>({});

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

    // Preload bundled audio clips at startup. If any clip fails to load, we keep going and rely on TTS fallback.
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      } catch (e) {
        // ignore
      }

      const keys = Object.keys(AUDIO_MAP);
      for (const k of keys) {
        try {
          const module = AUDIO_MAP[k];
          if (!module) continue;
          const { sound } = await Audio.Sound.createAsync(module, { shouldPlay: false });
          loadedSounds.current[k] = sound;
        } catch (e) {
          console.warn('Failed to preload audio', k, e);
          loadedSounds.current[k] = null;
        }
      }
      setSoundsLoaded(true);
    })();

    return () => {
      // Unload all sounds on unmount
      const keys = Object.keys(loadedSounds.current);
      keys.forEach(async (k) => {
        const s = loadedSounds.current[k];
        if (s) {
          try {
            await s.unloadAsync();
          } catch (e) {}
        }
      });
    };
  }, []);

  useEffect(() => {
    if (countedCount === items.length && items.length > 0) {
      onRoundComplete();
    }
  }, [countedCount, items]);

  useEffect(() => {
    // Announce when settings modal opens/closes for screen readers
    if (settingsOpen) {
      AccessibilityInfo.announceForAccessibility('Parent settings opened');
    } else {
      AccessibilityInfo.announceForAccessibility('Parent settings closed');
    }
  }, [settingsOpen]);

  function initRound(n: number) {
    const arr: ItemState[] = Array.from({ length: n }, (_, i) => ({ id: i, counted: false, anim: new Animated.Value(0), order: null }));
    setItems(arr);
    setCountedCount(0);
    setShowCongrats(false);
  }

  async function playBundledClip(name: string): Promise<boolean> {
    // Try to play a preloaded bundled clip. Return true if playback started, false to indicate fallback.
    try {
      const sound = loadedSounds.current[name];
      if (!sound) return false;
      // replay from start
      try {
        await sound.replayAsync();
        return true;
      } catch (e) {
        // if replayAsync fails try playAsync
        try {
          await sound.playAsync();
          return true;
        } catch (e2) {
          console.warn('Playback error for', name, e2);
          return false;
        }
      }
    } catch (e) {
      console.warn('Bundled audio playback failed for', name, e);
      return false;
    }
  }

  async function playNumber(n: number | null | undefined) {
    if (n == null) return;
    const name = String(n);
    const played = await playBundledClip(name);
    if (!played) {
      // Fallback to system TTS (use a consistent female-like pitch)
      Speech.speak(String(n), { pitch: 1.05, rate: 0.95 });
    }
  }

  function onTapItem(index: number) {
    const it = items[index];
    if (!it) return;

    // If already counted, re-say the assigned order
    if (it.counted) {
      playNumber(it.order ?? index + 1);
      return;
    }

    // Compute the tap-order number (running count) and perform side-effects OUTSIDE the state updater
    const thisNumber = countedCount + 1;

    // Animate the tapped duck
    Animated.sequence([
      Animated.timing(it.anim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(it.anim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    // Speak the running count (and/or bundled clip)
    playNumber(thisNumber);

    // Update state immutably, pure updater only
    setItems(prev => prev.map((x, i) => i === index ? { ...x, counted: true, order: thisNumber } : x));
    setCountedCount(c => c + 1);
  }

  async function onRoundComplete() {
    // Cardinality moment: restate total and a brief celebration
    setShowCongrats(true);
    const total = items.length;

    // Announce via screen reader so TalkBack/VoiceOver users hear the same cardinality moment
    AccessibilityInfo.announceForAccessibility(`Yay! ${total} ducks!`);

    // Play a brief confetti sound immediately with the visual effect. If it fails, ignore and continue.
    playBundledClip('confetti').catch(() => {});

    // Try to play a short celebration + restatement using bundled clips. If either fails, fall back to TTS.
    const playedTotal = await playBundledClip('total');
    if (!playedTotal) {
      // Short chime + restatement via TTS
      Speech.speak('Yay!', { pitch: 1.2, rate: 1.0 });
      setTimeout(() => {
        Speech.speak(`${total} ducks!`);
      }, 600);

      // Follow-up prompt after a short delay
      setTimeout(() => {
        Speech.speak('Now count your fingers!');
      }, 1500);
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
      // replaced Alert for now with a softer UX note — keep Alert for dev builds
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
    const accessibilityLabel = it.counted && it.order != null ? `Duck, counted, number ${it.order}` : 'Duck';
    return (
      <Pressable
        key={it.id}
        onPress={() => onTapItem(i)}
        style={{ margin: 8 }}
        hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Tap to hear the number"
        accessibilityState={{ selected: it.counted }}
      >
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
        <Pressable
          onPressIn={onParentGatePressIn}
          onPressOut={onParentGatePressOut}
          accessibilityLabel="Parent settings"
          accessibilityHint="Press and hold for two seconds to open parent settings"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
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

      {/* Confetti runs when showCongrats is true */}
      <Confetti trigger={showCongrats} />

      <View style={styles.footer}>
        <Text style={styles.prompt}>Round {round} — Tap each duck once</Text>
        <Pressable
          onPress={onNextRound}
          style={styles.nextButton}
          accessibilityLabel="Next round"
          accessibilityHint="Go to the next round"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      <Modal visible={settingsOpen} animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.settings}>
          <Text accessibilityRole="header" style={styles.settingsTitle}>Settings (placeholder)</Text>
          <Text style={styles.settingsNote}>Parent-gated placeholder. Nothing to configure in v1.</Text>
          <Pressable
            onPress={() => setSettingsOpen(false)}
            style={styles.closeButton}
            accessibilityLabel="Close settings"
            accessibilityHint="Closes the parent settings"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
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
