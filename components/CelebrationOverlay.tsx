import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import THEME from '../constants/theme';

type Props = {
  total: number;
  onContinue: () => void;
};

export default function CelebrationOverlay({ total, onContinue }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.centerBubble}>
        <Text style={styles.bigNumber}>{total}</Text>
      </View>
      <Text style={styles.message}>Great counting!</Text>
      <Pressable onPress={onContinue} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.COLORS.deepWater },
  centerBubble: { width: 200, height: 200, borderRadius: 100, backgroundColor: THEME.COLORS.celebration, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  bigNumber: { fontSize: 72, fontWeight: '800' as any, color: '#0A4D6E', fontFamily: THEME.TYPE.fontFamily },
  message: { fontSize: 20, color: '#fff', marginBottom: 24, fontFamily: THEME.TYPE.fontFamily },
  button: { backgroundColor: THEME.COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontFamily: THEME.TYPE.fontFamily },
});
