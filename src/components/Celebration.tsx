import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Celebration: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Placeholder for confetti + chime animation; implemented in later commits */}
      <Text accessibilityLabel="Celebration">✨</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }
});

export default Celebration;
