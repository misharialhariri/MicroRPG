import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { HERO_CLASSES } from '../lib/constants';
import { saveRun } from '../lib/db';
import { useGame } from '../hooks/useGame';

export default function GameOverScreen() {
  const { hero, dungeon, currentRoomIndex, state } = useGame();
  const causeOfDeath = state.causeOfDeath ?? 'Fell in the darkness';

  const titleScale = useRef(new Animated.Value(0.3)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hero && dungeon) {
      try {
        saveRun({
          hero_class: hero.classKey,
          hero_name: hero.name,
          rooms_cleared: currentRoomIndex,
          dungeon_name: dungeon.dungeon_name,
          cause_of_death: causeOfDeath,
          final_level: hero.level,
          gold_collected: hero.gold,
          outcome: 'death',
        });
      } catch {}
    }

    Animated.stagger(200, [
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(statsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cls = hero ? HERO_CLASSES[hero.classKey] : null;
  const clsColor = cls ? Colors[cls.colorKey] : Colors.primary;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: Animated.multiply(titleScale, pulseAnim) }], opacity: titleOpacity }}>
        <Text style={styles.deathIcon}>💀</Text>
        <Text style={styles.titleTop}>YOU HAVE</Text>
        <Text style={styles.titleMain}>FALLEN</Text>
      </Animated.View>

      <Animated.View style={[styles.statsCard, { opacity: statsOpacity }]}>
        <Row label="HERO" value={`${cls?.emoji} ${hero?.name}`} valueColor={clsColor} />
        <Divider />
        <Row label="CLASS" value={cls?.name ?? '—'} valueColor={clsColor} />
        <Divider />
        <Row label="DUNGEON" value={dungeon?.dungeon_name ?? '—'} />
        <Divider />
        <Row label="ROOMS CLEARED" value={`${currentRoomIndex}/${dungeon?.rooms?.length ?? 5}`} />
        <Divider />
        <Row label="LEVEL REACHED" value={hero?.level ?? 1} valueColor={Colors.secondary} />
        <Divider />
        <Row label="GOLD COLLECTED" value={`${hero?.gold ?? 0} ⚙`} valueColor={Colors.secondary} />
        <Divider />
        <View style={styles.causeRow}>
          <Text style={styles.statLabel}>CAUSE OF DEATH</Text>
          <Text style={styles.cause}>{causeOfDeath}</Text>
        </View>
      </Animated.View>

      <Text style={styles.epitaph}>
        {'"Few descend. Fewer return. None are forgotten."'}
      </Text>

      <Animated.View style={[styles.buttons, { opacity: btnOpacity }]}>
        <Pressable style={styles.retryBtn} onPress={() => router.replace('/hero-select')}>
          <Text style={styles.retryBtnText}>⚔  TRY AGAIN</Text>
        </Pressable>
        <Pressable style={styles.menuBtn} onPress={() => router.replace('/')}>
          <Text style={styles.menuBtnText}>MAIN MENU</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}
function Divider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 18,
  },
  deathIcon: { fontSize: 56, textAlign: 'center', marginBottom: 4 },
  titleTop: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelSubtitle,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 3,
  },
  titleMain: {
    fontFamily: Typography.fontPixel,
    fontSize: 26,
    color: Colors.danger,
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: Colors.danger,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  statsCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  causeRow: { gap: 4 },
  statLabel: { fontFamily: Typography.fontPixel, fontSize: 6, color: Colors.textMuted, letterSpacing: 0.5 },
  statValue: { fontFamily: Typography.fontPixel, fontSize: 7, color: Colors.textPrimary, flex: 1, textAlign: 'right', marginLeft: 8 },
  cause: { fontFamily: Typography.fontBody, fontSize: Typography.bodySmall, color: Colors.danger, lineHeight: 18 },
  divider: { height: 1, backgroundColor: Colors.border },
  epitaph: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  buttons: { width: '100%', gap: 10 },
  retryBtn: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textPrimary, letterSpacing: 1 },
  menuBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  menuBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textSecondary, letterSpacing: 1 },
});
