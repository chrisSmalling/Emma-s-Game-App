import React from 'react';
import { Image, StyleSheet } from 'react-native';
import TappableObject, { CountableObjectProps } from './TappableObject';

const FISH_SOURCES = [
  require('../assets/fish/kenney/fish_orange.png'),
  require('../assets/fish/kenney/fish_pink.png'),
  require('../assets/fish/kenney/fish_blue.png'),
  require('../assets/fish/kenney/fish_green.png'),
];

export default function Fish({ index, counted, order, onPress, interactive }: CountableObjectProps) {
  const src = FISH_SOURCES[index % FISH_SOURCES.length];

  return (
    <TappableObject
      index={index}
      counted={counted}
      order={order}
      onPress={onPress}
      interactive={interactive}
      objectLabel="Fish"
    >
      <Image source={src} style={styles.image} resizeMode="contain" />
    </TappableObject>
  );
}

const styles = StyleSheet.create({
  image: { width: 68, height: 68 },
});
