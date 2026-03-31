import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { HERO_CLASSES } from '../lib/constants';

export default function HeroAvatar({ classKey, size = 48 }) {
  const cls = HERO_CLASSES[classKey];
  const color = cls ? Colors[cls.colorKey] : Colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={{ fontSize: size * 0.5 }}>{cls?.emoji ?? '🧙'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
