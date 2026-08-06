import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';
import Confetti from './Confetti';

type Props = {
  total: number;
  bridgePrompt: string;
  isLastRound: boolean;
  onNext: () => void;
};

export default function CelebrationOverlay({ total, bridgePrompt, isLastRound, onNext }: Props) {
  return (
    <View style={styles.container}>
      <Confetti trigger burstCount={24} />
      <View style={styles.centerBubble}>
        <Text style={styles.bigNumber}>{total}</Text>
      </View>
      <Text style={styles.message}>
        {total} {total === 1 ? 'fish' : 'fish'}! Great counting!
      </Text>
      <Text style={styles.together}>Say it out loud together!</Text>
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>{bridgePrompt}</Text>
      </View>
      <Pressable onPress={onNext} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>{isLastRound ? 'Finish' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.COLORS.deepWater, padding: THEME.SPACING.xl },
  centerBubble: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: THEME.COLORS.celebration,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SPACING.l,
  },
  bigNumber: { fontSize: 88, color: THEME.COLORS.deepWater, fontFamily: THEME.TYPE.fontFamilyBold },
  message: { fontSize: THEME.TYPE.title, color: '#fff', fontFamily: THEME.TYPE.fontFamilyBold, textAlign: 'center' },
  together: { fontSize: THEME.TYPE.body, color: THEME.COLORS.celebration, fontFamily: THEME.TYPE.fontFamily, marginTop: THEME.SPACING.s, marginBottom: THEME.SPACING.l },
  promptCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: THEME.SPACING.m,
    paddingHorizontal: THEME.SPACING.xl,
    marginBottom: THEME.SPACING.xl,
  },
  promptText: { fontSize: THEME.TYPE.body, color: '#fff', fontFamily: THEME.TYPE.fontFamily, textAlign: 'center' },
  button: { backgroundColor: THEME.COLORS.accent, paddingHorizontal: THEME.SPACING.xxl, paddingVertical: THEME.SPACING.m, borderRadius: 16 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: THEME.TYPE.fontFamilyBold },
});
