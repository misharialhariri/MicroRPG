import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function DiceRoll({ rolling, result, isCrit = false }) {
  const [display, setDisplay] = useState('?');
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!rolling) {
      setDisplay(result != null ? String(result) : '?');
      scale.value = withSpring(1.3, { stiffness: 300 }, () => {
        scale.value = withSpring(1);
      });
      return;
    }

    // Spin animation
    rotation.value = withRepeat(withTiming(360, { duration: 200 }), -1);
    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 100 }), withTiming(0.9, { duration: 100 })),
      -1
    );

    // Rapid number cycling
    let count = 0;
    const MAX = 18;
    const id = setInterval(() => {
      setDisplay(String(Math.floor(Math.random() * 20) + 1));
      count++;
      if (count >= MAX) clearInterval(id);
    }, 75);

    return () => {
      clearInterval(id);
      rotation.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1);
    };
  }, [rolling, result]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[styles.dice, isCrit && styles.diceCrit, animStyle]}
      >
        <Text style={styles.icon}>🎲</Text>
        <Text style={[styles.number, isCrit && styles.numberCrit]}>{display}</Text>
      </Animated.View>
      {isCrit && !rolling && (
        <Text style={styles.critLabel}>CRITICAL!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 6 },
  dice: {
    width: 72,
    height: 72,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceCrit: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryDark + '33',
  },
  icon: { fontSize: 14, position: 'absolute', top: 6, right: 6 },
  number: {
    fontFamily: Typography.fontPixel,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  numberCrit: { color: Colors.secondary },
  critLabel: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelLabel,
    color: Colors.secondary,
    letterSpacing: 1,
  },
});
