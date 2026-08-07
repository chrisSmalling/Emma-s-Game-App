import React from 'react';
import { StyleSheet, View } from 'react-native';
import THEME from '../constants/theme';
import TappableObject, { CountableObjectProps } from './TappableObject';

// Locked palette colors only — see DESIGN-BRIEF.md.
const SWATCHES: { color: string; label: string }[] = [
  { color: THEME.COLORS.accent, label: 'Coral' },
  { color: THEME.COLORS.counted, label: 'Teal' },
  { color: THEME.COLORS.midWater, label: 'Blue' },
  { color: THEME.COLORS.fish[0], label: 'Orange' },
  { color: THEME.COLORS.fish[1], label: 'Pink' },
  { color: THEME.COLORS.celebration, label: 'Yellow' },
];

export default function ColorBlob({ index, counted, order, onPress, interactive }: CountableObjectProps) {
  const swatch = SWATCHES[index % SWATCHES.length];

  return (
    <TappableObject
      index={index}
      counted={counted}
      order={order}
      onPress={onPress}
      interactive={interactive}
      objectLabel={`${swatch.label} circle`}
    >
      <View style={[styles.blob, { backgroundColor: swatch.color }]} />
    </TappableObject>
  );
}

const styles = StyleSheet.create({
  blob: { width: 72, height: 72, borderRadius: 36 },
});
