import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { HERO_CLASSES } from '../lib/constants';
import HeroAvatar from './HeroAvatar';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RunSummaryCard({ run, rank }) {
  const cls = HERO_CLASSES[run.hero_class];
  const isVictory = run.outcome === 'victory';
  const date = new Date(run.created_at).toLocaleDateString();

  return (
    <View style={[styles.card, isVictory && styles.cardVictory]}>
      <Text style={styles.medal}>{MEDALS[rank] ?? `#${rank + 1}`}</Text>

      <HeroAvatar classKey={run.hero_class} size={38} />

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.heroName}>{run.hero_name}</Text>
          <View style={[styles.badge, isVictory ? styles.victoryBadge : styles.deathBadge]}>
            <Text style={styles.badgeText}>{isVictory ? '⚔ VICTORY' : '💀 FALLEN'}</Text>
          </View>
        </View>
        <Text style={styles.dungeonName}>{run.dungeon_name}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>Rooms: {run.rooms_cleared}</Text>
          <Text style={styles.stat}>Lvl: {run.final_level}</Text>
          <Text style={[styles.stat, { color: Colors.secondary }]}>⚙ {run.gold_collected}g</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  cardVictory: { borderColor: Colors.borderGold },
  medal: { fontSize: 22, minWidth: 28 },
  info: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroName: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelLabel,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  victoryBadge: { backgroundColor: Colors.success + '33' },
  deathBadge: { backgroundColor: Colors.danger + '33' },
  badgeText: {
    fontFamily: Typography.fontPixel,
    fontSize: 5,
    color: Colors.textPrimary,
  },
  dungeonName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stat: {
    fontFamily: Typography.fontPixel,
    fontSize: 6,
    color: Colors.textSecondary,
  },
  date: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
});
