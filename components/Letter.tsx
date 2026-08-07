import React from 'react';
import { StyleSheet, Text } from 'react-native';
import THEME from '../constants/theme';
import TappableObject, { CountableObjectProps } from './TappableObject';

// Uppercase, first five letters — enough range for maxCount 5 across every
// level. This activity counts objects that happen to be letters; it doesn't
// teach letter sounds or names, same as Shapes doesn't teach geometry terms.
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Locked palette colors only — see DESIGN-BRIEF.md.
const LETTER_COLORS = [...THEME.COLORS.fish, THEME.COLORS.counted, THEME.COLORS.accent];

export default function Letter({ index, counted, order, onPress, interactive }: CountableObjectProps) {
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
