import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function ChoiceButton({ text, onPress, disabled = false, index = 0 }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={[styles.btn, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => { scale.value = withSpring(0.96, { stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 300 }); }}
      >
        <Text style={styles.index}>{index + 1}.</Text>
        <Text style={styles.text}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  disabled: { opacity: 0.4 },
  index: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelLabel,
    color: Colors.primary,
    minWidth: 16,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: Typography.bodySmall * Typography.lineHeightBody,
  },
});
