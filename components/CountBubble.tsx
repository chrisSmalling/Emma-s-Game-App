import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';

type Props = {
  order: number;
};

// The number-in-a-bubble that appears above a fish once it's been counted.
export default function CountBubble({ order }: Props) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{order}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    top: -14,
    right: -6,
    backgroundColor: THEME.COLORS.counted,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  text: { color: '#fff', fontFamily: THEME.TYPE.fontFamilyBold, fontSize: 14 },
});
