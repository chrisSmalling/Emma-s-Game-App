import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../../constants/theme';
import { LetterEntry } from '../../constants/letters.en';

type Props = {
  letter: LetterEntry | null; // null until this slot is filled, in order
};

// One position in the word-building slots row (brief: `_ _ _` filling to
// `c a t`). A fixed-size box whether empty or filled so the row never
// reflows as letters land.
export default function WordSlot({ letter }: Props) {
  return (
    <View style={[styles.slot, letter && styles.filled]}>
      {letter && <Text style={styles.glyph}>{letter.display}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 72,
    height: 84,
    borderRadius: 16,
    marginHorizontal: THEME.SPACING.s,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: '#fff',
    borderStyle: 'solid',
    borderColor: THEME.COLORS.counted,
  },
  glyph: { fontSize: 44, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.deepWater },
});
