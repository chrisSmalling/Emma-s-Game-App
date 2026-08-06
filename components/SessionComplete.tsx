import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';

type Props = {
  highestCountReached: number;
  onPlayAgain: () => void;
};

export default function SessionComplete({ highestCountReached, onPlayAgain }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐠🐟🐡</Text>
      <Text style={styles.title}>Great counting today!</Text>
      {highestCountReached > 0 && (
        <Text style={styles.subtitle}>Best count so far: {highestCountReached}</Text>
      )}
      <Pressable onPress={onPlayAgain} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Play again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.COLORS.deepWater, padding: THEME.SPACING.xl },
  emoji: { fontSize: 48, marginBottom: THEME.SPACING.l },
  title: { fontSize: THEME.TYPE.largeTitle, color: '#fff', fontFamily: THEME.TYPE.fontFamilyBold, textAlign: 'center', marginBottom: THEME.SPACING.s },
  subtitle: { fontSize: THEME.TYPE.body, color: THEME.COLORS.celebration, fontFamily: THEME.TYPE.fontFamily, marginBottom: THEME.SPACING.xxl },
  button: { backgroundColor: THEME.COLORS.accent, paddingHorizontal: THEME.SPACING.xxl, paddingVertical: THEME.SPACING.m, borderRadius: 16, marginTop: THEME.SPACING.l },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: THEME.TYPE.fontFamilyBold },
});
