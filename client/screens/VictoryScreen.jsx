import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { HERO_CLASSES } from '../lib/constants';
import { saveRun } from '../lib/db';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import StatBar from '../components/StatBar';

export default function VictoryScreen() {
  const { hero, dungeon, currentRoomIndex, inventory, state } = useGame();
  const { play } = useSound();

  const crownAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    play('victory');

    if (hero && dungeon) {
      try {
        saveRun({
          hero_class: hero.classKey,
          hero_name: hero.name,
          rooms_cleared: dungeon.rooms?.length ?? 5,
          dungeon_name: dungeon.dungeon_name,
          cause_of_death: null,
          final_level: hero.level,
          gold_collected: hero.gold,
          outcome: 'victory',
        });
      } catch {}
    }

    Animated.stagger(250, [
      Animated.spring(crownAnim, { toValue: 1, tension: 45, friction: 6, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cls = hero ? HERO_CLASSES[hero.classKey] : null;
  const clsColor = cls ? Colors[cls.colorKey] : Colors.secondary;
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ scale: crownAnim }], opacity: crownAnim, alignItems: 'center' }}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Animated.Text style={[styles.victoryText, { opacity: glowOpacity }]}>VICTORY</Animated.Text>
          <Text style={styles.subtitle}>{dungeon?.dungeon_name ?? 'The Dungeon'} has been conquered.</Text>
        </Animated.View>

        <Animated.View style={[styles.statsCard, { opacity: statsAnim }]}>
          <Text style={styles.cardTitle}>RUN SUMMARY</Text>

          <View style={styles.heroRow}>
            <Text style={styles.heroEmoji}>{cls?.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroName, { color: clsColor }]}>{hero?.name}</Text>
              <Text style={styles.heroClass}>{cls?.name}</Text>
            </View>
            <View style={[styles.levelBadge, { borderColor: clsColor }]}>
              <Text style={[styles.levelText, { color: clsColor }]}>Lv {hero?.level}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <StatRow label="Rooms Cleared" value={`${dungeon?.rooms?.length ?? 5}/5`} />
          <StatRow label="Gold Collected" value={`${hero?.gold ?? 0} ⚙`} valueColor={Colors.secondary} />
          <StatRow label="Final HP" value={`${hero?.hp}/${hero?.maxHp}`} />
          <StatRow label="Final MP" value={`${hero?.mp}/${hero?.maxMp}`} />
          <StatRow label="Items Held" value={`${inventory.length}/${5}`} />

          {inventory.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.invLabel}>INVENTORY</Text>
              <View style={styles.invRow}>
                {inventory.map((item, i) => (
                  <View key={i} style={styles.invItem}>
                    <Text style={styles.invEmoji}>{item.emoji}</Text>
                    <Text style={styles.invName}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>

        <Text style={styles.closingLore}>
          Your legend echoes through these cursed halls.
        </Text>

        <Animated.View style={[styles.buttons, { opacity: btnAnim }]}>
          <Pressable style={styles.playAgainBtn} onPress={() => router.replace('/hero-select')}>
            <Text style={styles.playAgainText}>⚔  PLAY AGAIN</Text>
          </Pressable>
          <Pressable style={styles.hofBtn} onPress={() => router.replace('/hall-of-fame')}>
            <Text style={styles.hofBtnText}>🏆  HALL OF FAME</Text>
          </Pressable>
          <Pressable style={styles.menuBtn} onPress={() => router.replace('/')}>
            <Text style={styles.menuBtnText}>MAIN MENU</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, gap: 20, paddingBottom: 40, alignItems: 'center' },
  crownEmoji: { fontSize: 72, textAlign: 'center', marginBottom: 4 },
  victoryText: {
    fontFamily: Typography.fontPixel,
    fontSize: 28,
    color: Colors.secondary,
    letterSpacing: 6,
    textShadowColor: Colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
    lineHeight: 16,
  },
  statsCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.secondary, letterSpacing: 1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroEmoji: { fontSize: 32 },
  heroName: { fontFamily: Typography.fontPixel, fontSize: 9, letterSpacing: 0.5 },
  heroClass: { fontFamily: Typography.fontBody, fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  levelBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  levelText: { fontFamily: Typography.fontPixel, fontSize: 7 },
  divider: { height: 1, backgroundColor: Colors.border },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontFamily: Typography.fontPixel, fontSize: 6, color: Colors.textMuted },
  statValue: { fontFamily: Typography.fontPixel, fontSize: 7, color: Colors.textPrimary },
  invLabel: { fontFamily: Typography.fontPixel, fontSize: 6, color: Colors.textMuted },
  invRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  invItem: { alignItems: 'center', gap: 2 },
  invEmoji: { fontSize: 22 },
  invName: { fontFamily: Typography.fontPixel, fontSize: 5, color: Colors.textSecondary, textAlign: 'center', maxWidth: 56 },
  closingLore: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttons: { width: '100%', gap: 10 },
  playAgainBtn: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textPrimary, letterSpacing: 1 },
  hofBtn: {
    backgroundColor: Colors.secondaryDark + '33',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  hofBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.secondary, letterSpacing: 1 },
  menuBtn: {
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  menuBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.textMuted },
});
