import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Duck from '../components/Duck';
import { Audio } from 'expo-av';

const CountingScreen: React.FC = () => {
  // For this smallest slice we start with a single-round target of N = 1.
  // This component focuses on rendering tappable ducks, marking them counted,
  // and playing a bundled number audio clip when a duck is tapped.
  const target = 1; // smallest useful test case
  const [counted, setCounted] = React.useState<boolean[]>(Array(target).fill(false));
  const soundRef = React.useRef<Audio.Sound | null>(null);

  React.useEffect(() => {
    let mounted = true;

    // Pre-load the "one" audio clip so taps have minimal latency.
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/audio/1.mp3')
        );
        if (!mounted) {
          // If unmounted right after load, unload immediately
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch (e) {
        console.warn('Failed to load audio (placeholder):', e);
      }
    })();

    return () => {
      mounted = false;
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch (e) {
          // ignore
        }
      })();
    };
  }, []);

  const playTapSound = async () => {
    try {
      if (soundRef.current) {
        // Replay from start on every tap
        await soundRef.current.replayAsync();
      }
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  };

  const handleDuckPress = (index: number) => {
    // Play the number audio for the running count (for this slice N=1 it's always "one").
    playTapSound();

    setCounted(prev => {
      // If already counted, keep it counted (Duck will still animate when pressed)
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header} accessible accessibilityRole="header">
        {/* For a toddler UI this would be icon/audio-only; this text is a debug/dev affordance for now. */}
        <Text style={styles.title}>Little Counter — Round 1</Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.duckRow}>
          {Array.from({ length: target }).map((_, i) => (
            <Duck
              key={`duck-${i}`}
              counted={counted[i]}
              size={96}
              onPress={() => handleDuckPress(i)}
            />
          ))}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.nextButton, { opacity: 0.5 }]}
          onPress={() => Alert.alert('Next', 'Next round (not implemented in this slice)')}
          accessibilityLabel="Next"
          disabled
        >
          <Text style={styles.nextText}>Next (disabled)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5', alignItems: 'center' },
  header: { marginTop: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  stage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  duckRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  controls: { width: '100%', padding: 24, alignItems: 'center' },
  nextButton: { backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  nextText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});

export default CountingScreen;
