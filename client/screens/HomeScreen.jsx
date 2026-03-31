import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, StatusBar, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { getRunStats } from '../lib/db';
import { checkServerHealth } from '../lib/api';
import { useGame } from '../hooks/useGame';

function EmberParticle({ delay }) {
  const x = useRef(new Animated.Value(Math.random() * 300)).current;
  const y = useRef(new Animated.Value(700)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      x.setValue(Math.random() * 340);
      y.setValue(720);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -20, duration: 4000 + Math.random() * 3000, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.8, duration: 600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]),
      ]).start(loop);
    };
    loop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ember, { transform: [{ translateX: x }, { translateY: y }], opacity }]}
    />
  );
}

export default function HomeScreen() {
  const { resetGame } = useGame();
  const [stats, setStats] = useState({ total: 0, victories: 0 });
  const [online, setOnline] = useState(true);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(-30)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    resetGame();

    // Load stats and health check in parallel
    Promise.all([
      getRunStats(),
      checkServerHealth(),
    ]).then(([s, isOnline]) => {
      setStats(s);
      setOnline(isOnline);
    });

    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Ember particles */}
      {[0, 400, 900, 1400, 2100, 2700].map((d, i) => (
        <EmberParticle key={i} delay={d} />
      ))}

      <Animated.View style={[styles.titleBlock, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        <Text style={styles.titleTop}>⚔</Text>
        <Text style={styles.titleMain}>MICRO</Text>
        <Text style={styles.titleAccent}>RPG</Text>
        <Text style={styles.tagline}>Descend. Survive. Conquer.</Text>
      </Animated.View>

      {!online && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠  No connection — the dungeon is unreachable</Text>
        </View>
      )}

      <Animated.View style={[styles.buttonGroup, { opacity: btnOpacity }]}>
        <ActionButton
          label="⚔  NEW RUN"
          onPress={() => router.push('/hero-select')}
          primary
        />
        <ActionButton
          label="🏆  HALL OF FAME"
          onPress={() => router.push('/hall-of-fame')}
        />
      </Animated.View>

      {stats.total > 0 && (
        <Animated.View style={[styles.statsBar, { opacity: btnOpacity }]}>
          <Text style={styles.statItem}>Runs: {stats.total}</Text>
          <View style={styles.statDivider} />
          <Text style={styles.statItem}>Victories: {stats.victories}</Text>
          <View style={styles.statDivider} />
          <Text style={[styles.statItem, { color: Colors.secondary }]}>
            {stats.total > 0 ? Math.round((stats.victories / stats.total) * 100) : 0}% win rate
          </Text>
        </Animated.View>
      )}

      <Text style={styles.footer}>Powered by Claude AI  ·  v2.0</Text>
    </View>
  );
}

function ActionButton({ label, onPress, primary }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.btn, primary && styles.btnPrimary, { transform: [{ scale }] }]}>
        <Text style={[styles.btnText, !primary && styles.btnTextSecondary]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  ember: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  titleBlock: { alignItems: 'center', marginBottom: 48 },
  titleTop: { fontSize: 42, marginBottom: 4 },
  titleMain: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelHero,
    color: Colors.primary,
    letterSpacing: 6,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  titleAccent: {
    fontFamily: Typography.fontPixel,
    fontSize: 36,
    color: Colors.secondary,
    letterSpacing: 10,
    marginTop: 2,
    textShadowColor: Colors.secondaryDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 16,
  },
  offlineBanner: {
    backgroundColor: Colors.danger + '33',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  offlineText: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.danger,
    textAlign: 'center',
  },
  buttonGroup: { width: '100%', gap: 12, marginBottom: 24 },
  btn: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 4,
  },
  btnPrimary: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelSubtitle,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  btnTextSecondary: { color: Colors.textSecondary },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
  },
  statItem: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textSecondary,
  },
  statDivider: { width: 1, height: 12, backgroundColor: Colors.border },
  footer: {
    position: 'absolute',
    bottom: 28,
    fontFamily: Typography.fontPixel,
    fontSize: 5,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
