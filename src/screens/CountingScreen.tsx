import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Duck from '../components/Duck';

const CountingScreen: React.FC = () => {
  // For this smallest slice we start with a single-round target of N = 1.
  // This component focuses on rendering tappable ducks and marking them as counted.
  const target = 1; // smallest useful test case
  const [counted, setCounted] = React.useState<boolean[]>(Array(target).fill(false));

  const handleDuckPress = (index: number) => {
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
