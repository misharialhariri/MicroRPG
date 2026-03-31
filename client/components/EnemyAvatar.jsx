import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

const ENEMY_EMOJIS = ['👹', '💀', '🐉', '🕷️', '👺', '🦇', '🐍', '💣'];

function getEmojiForName(name = '') {
  const n = name.toLowerCase();
  if (n.includes('dragon') || n.includes('wyrm')) return '🐉';
  if (n.includes('spider') || n.includes('arachn')) return '🕷️';
  if (n.includes('bat') || n.includes('vampire')) return '🦇';
  if (n.includes('serpent') || n.includes('snake')) return '🐍';
  if (n.includes('skeleton') || n.includes('bone')) return '💀';
  if (n.includes('demon') || n.includes('devil')) return '👹';
  if (n.includes('golem') || n.includes('stone')) return '🗿';
  const idx = Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % ENEMY_EMOJIS.length;
  return ENEMY_EMOJIS[idx];
}

export default function EnemyAvatar({ name, size = 80, flash = false, stunned = false }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (flash) {
      opacity.value = withSequence(
        withTiming(0.2, { duration: 80 }),
        withTiming(1, { duration: 80 }),
        withTiming(0.2, { duration: 80 }),
        withTiming(1, { duration: 80 })
      );
    }
  }, [flash]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const emoji = getEmojiForName(name);

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, animStyle]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
        {stunned && (
          <View style={styles.stunnedBadge}>
            <Text style={styles.stunnedText}>💫 STUNNED</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  circle: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stunnedBadge: {
    position: 'absolute',
    bottom: -14,
    backgroundColor: Colors.warning + 'CC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stunnedText: {
    fontFamily: 'PressStart2P',
    fontSize: 5,
    color: Colors.black,
  },
});
