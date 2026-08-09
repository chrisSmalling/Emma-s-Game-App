import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import THEME from '../../constants/theme';
import '../lottieWasmSetup';

const CELEBRATION_LOTTIE = require('../../assets/lottie/celebration.json');

type Props = {
  word: string;
};

// Stage L3's completion moment (brief: "one calm celebration per word...
// not loud"). Unlike Counting's CelebrationOverlay, this does NOT replace
// the scene or wait for a button tap — it's a small in-scene moment layered
// over the completed word, and useWordBuilding auto-advances to the next
// word after a beat. Reuses the same celebration Lottie asset rather than
// adding a second one.
export default function WordCelebration({ word }: Props) {
  return (
    <View style={styles.container} pointerEvents="none">
      <LottieView
        source={CELEBRATION_LOTTIE}
        autoPlay
        loop={false}
        style={styles.lottie}
        webStyle={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
      <Text style={styles.word}>{word}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  lottie: { ...StyleSheet.absoluteFillObject },
  word: {
    fontSize: 56,
    fontFamily: THEME.TYPE.fontFamilyBold,
    color: '#fff',
    textShadowColor: THEME.COLORS.deepWater,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
});
