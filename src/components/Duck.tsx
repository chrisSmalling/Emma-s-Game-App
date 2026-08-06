import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated, Image } from 'react-native';

type Props = {
  counted?: boolean;
  onPress?: () => void;
  size?: number;
};

const Duck: React.FC<Props> = ({ counted = false, onPress, size = 80 }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true })
    ]).start();
    onPress && onPress();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} accessibilityRole="button">
      <Animated.View style={[styles.container, { transform: [{ scale }], width: size, height: size, borderRadius: size / 8, backgroundColor: counted ? '#FFEE58' : '#FFF8E1' }]}>
        {/* Placeholder duck graphic: replace with an svg or image in later commits */}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', margin: 8 }
});

export default Duck;
