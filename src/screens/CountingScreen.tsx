import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CountingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text accessible accessibilityLabel="App title" style={styles.title}>Little Counter</Text>
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Counting activity will appear here.</Text>
        <TouchableOpacity style={styles.startButton} onPress={() => {}} accessibilityLabel="Start">
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  header: { marginTop: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, color: '#666', marginBottom: 20 },
  startButton: { backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  startText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});

export default CountingScreen;
