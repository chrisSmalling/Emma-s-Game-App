import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';

// Simple press-and-hold parent gate stub. Hold for 1200ms to "unlock".
const ParentGate: React.FC<{ onUnlock?: () => void }> = ({ onUnlock }) => {
  const handleLongPress = () => {
    Alert.alert('Parent gate', 'Unlocked (placeholder settings screen)');
    onUnlock && onUnlock();
  };

  return (
    <View style={styles.container}>
      <Pressable android_ripple={{ color: '#DDD' }} onLongPress={handleLongPress} delayLongPress={1200} accessibilityLabel="Press and hold to open settings">
        <View style={styles.gate} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12 },
  gate: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EEE' }
});

export default ParentGate;
