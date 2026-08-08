import React from 'react';
import { StyleSheet, Text } from 'react-native';
import THEME from '../constants/theme';
import TappableObject, { CountableObjectProps } from './TappableObject';

// Uppercase, first five letters — enough range for maxCount 5 across every
// level. This is the "Letter Shapes" COUNTING subject: it counts objects
// that happen to be letters, same as Shapes counts geometric shapes. It does
// NOT teach letter sounds or names — that's the separate phonics vertical in
// components/letters/ (see LETTERS-VERTICAL-BRIEF.md). Renamed from "Letters"
// to "Letter Shapes" specifically to avoid colliding with that vertical's name.
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Locked palette colors only — see DESIGN-BRIEF.md.
const LETTER_COLORS = [...THEME.COLORS.fish, THEME.COLORS.counted, THEME.COLORS.accent];

export default function LetterShape({ index, counted, order, onPress, interactive }: CountableObjectProps) {
  const letter = LETTERS[index % LETTERS.length];
  const color = LETTER_COLORS[index % LETTER_COLORS.length];

  return (
    <TappableObject
      index={index}
      counted={counted}
      order={order}
      onPress={onPress}
      interactive={interactive}
      objectLabel={`Letter ${letter}`}
    >
      <Text style={[styles.letter, { color }]}>{letter}</Text>
    </TappableObject>
  );
}

const styles = StyleSheet.create({
  letter: { fontSize: 48, fontFamily: THEME.TYPE.fontFamilyBold },
});
