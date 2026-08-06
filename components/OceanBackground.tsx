import React from 'react';
import { View, StyleSheet } from 'react-native';
import THEME from '../constants/theme';

export default function OceanBackground() {
  // Simple two-band background: surface + mid + sandy floor at bottom.
  // For Stage 1 we keep this lightweight and avoid extra native deps.
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.surface} />
      <View style={styles.mid} />
      <View style={styles.sand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  surface: { flex: 1, backgroundColor: THEME.COLORS.surfaceWater },
  mid: { height: 200, backgroundColor: THEME.COLORS.midWater, opacity: 0.95 },
  sand: { height: 120, backgroundColor: THEME.COLORS.sandyFloor },
});
