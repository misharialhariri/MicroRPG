import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function StatBar({ label, current, max, color, showNumbers = true, height = 8 }) {
  const pct = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const width = useSharedValue(pct);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 450, easing: Easing.out(Easing.quad) });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    height,
    backgroundColor: color,
    borderRadius: height / 2,
  }));

  const isLow = pct < 0.3 && color === Colors.hpBar;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View style={[barStyle, isLow && styles.lowPulse]} />
      </View>
      {showNumbers && (
        <Text style={[styles.numbers, isLow && { color: Colors.danger }]}>
          {current}/{max}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'right',
  },
  track: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  numbers: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textPrimary,
    minWidth: 52,
    textAlign: 'right',
  },
  lowPulse: { opacity: 0.9 },
});
