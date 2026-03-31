import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { HERO_CLASSES } from '../lib/constants';
import { useGame } from '../hooks/useGame';
import { useCombat } from '../hooks/useCombat';
import { useSound } from '../hooks/useSound';
import StatBar from '../components/StatBar';
import DiceRoll from '../components/DiceRoll';
import CombatLog from '../components/CombatLog';
import EnemyAvatar from '../components/EnemyAvatar';
import HeroAvatar from '../components/HeroAvatar';

function ActionButton({ label, onPress, disabled, color = Colors.primary, sub }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View
        style={[styles.actionBtn, { borderColor: color, transform: [{ scale }] }, disabled && styles.actionBtnDisabled]}
      >
        <Text style={[styles.actionBtnText, { color }, disabled && styles.disabledText]}>{label}</Text>
        {sub && <Text style={styles.actionBtnSub}>{sub}</Text>}
      </Animated.View>
    </Pressable>
  );
}

export default function CombatScreen() {
  const game = useGame();
  const { hero, dungeon, currentRoomIndex, currentRoom, enemyStunned, advanceRoom, triggerGameOver } = game;
  const { play } = useSound();
  const clsData = HERO_CLASSES[hero?.classKey];

  const enemy = currentRoom?.enemy ?? game.state?.lastCombatEnemy;
  const isBoss = currentRoom?.outcome_type === 'boss';

  const combat = useCombat(enemy, isBoss);
  const {
    enemyHp, enemyMaxHp, combatLog, phase, lastRoll, isCrit,
    isRolling, combatResult,
    handleAttack, handleAbility, handleUsePotion, handleFlee,
  } = combat;

  const heroFlash = useRef(new Animated.Value(1)).current;
  const enemyFlash = useRef(new Animated.Value(1)).current;
  const prevHeroHp = useRef(hero?.hp);
  const prevEnemyHp = useRef(enemyHp);

  // Flash on damage
  useEffect(() => {
    if (hero?.hp < prevHeroHp.current) {
      play('hit');
      Animated.sequence([
        Animated.timing(heroFlash, { toValue: 0.2, duration: 80, useNativeDriver: true }),
        Animated.timing(heroFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(heroFlash, { toValue: 0.2, duration: 80, useNativeDriver: true }),
        Animated.timing(heroFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
    prevHeroHp.current = hero?.hp;
  }, [hero?.hp]);

  useEffect(() => {
    if (enemyHp < prevEnemyHp.current) {
      Animated.sequence([
        Animated.timing(enemyFlash, { toValue: 0.15, duration: 80, useNativeDriver: true }),
        Animated.timing(enemyFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(enemyFlash, { toValue: 0.15, duration: 80, useNativeDriver: true }),
        Animated.timing(enemyFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
    prevEnemyHp.current = enemyHp;
  }, [enemyHp]);

  // Handle combat end
  useEffect(() => {
    if (combatResult === 'win') {
      play('victory');
      const leveledUp = game.state?.hero?.level > (hero?.level ?? 1);
      if (leveledUp) play('levelup');
      setTimeout(() => {
        const totalRooms = dungeon?.rooms?.length ?? 5;
        if (currentRoomIndex >= totalRooms - 1) {
          game.triggerVictory();
          router.replace('/victory');
        } else {
          advanceRoom();
          router.replace('/dungeon');
        }
      }, 1800);
    } else if (combatResult === 'lose') {
      play('death');
      triggerGameOver(`Slain by ${enemy?.name ?? 'a dungeon creature'}`);
      setTimeout(() => router.replace('/game-over'), 1500);
    } else if (combatResult === 'fled') {
      setTimeout(() => {
        advanceRoom();
        router.replace('/dungeon');
      }, 1200);
    }
  }, [combatResult]);

  if (!hero || !enemy) return null;

  const hasPotions = game.inventory.some((i) => i.type === 'potion');
  const clsAbility = clsData?.ability;
  const canUseAbility = hero.mp >= (clsAbility?.mpCost ?? 999);
  const clsColor = clsData ? Colors[clsData.colorKey] : Colors.primary;
  const isAnimating = phase === 'animating' || phase === 'enemy_turn';

  const winBanner = combatResult === 'win';
  const loseBanner = combatResult === 'lose';
  const fledBanner = combatResult === 'fled';

  return (
    <View style={styles.container}>
      {/* Result banners */}
      {winBanner && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultWin}>⚔  VICTORY!</Text>
        </View>
      )}
      {loseBanner && (
        <View style={[styles.resultBanner, styles.resultBannerDeath]}>
          <Text style={styles.resultDeath}>💀  YOU FELL</Text>
        </View>
      )}
      {fledBanner && (
        <View style={styles.resultBanner}>
          <Text style={[styles.resultWin, { color: Colors.warning }]}>🏃  ESCAPED</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Enemy section */}
        <View style={styles.enemySection}>
          <Animated.View style={{ opacity: enemyFlash }}>
            <EnemyAvatar name={enemy.name} size={90} stunned={enemyStunned} />
          </Animated.View>
          <Text style={styles.enemyName}>{enemy.name}</Text>
          {enemy.lore && <Text style={styles.enemyLore}>{enemy.lore}</Text>}
          <View style={styles.enemyHpRow}>
            <Text style={styles.enemyHpLabel}>HP</Text>
            <StatBar
              current={enemyHp}
              max={enemyMaxHp}
              color={Colors.danger}
              height={10}
              showNumbers
            />
          </View>
        </View>

        <View style={styles.separator} />

        {/* Dice + Log */}
        <View style={styles.middleRow}>
          <DiceRoll rolling={isRolling} result={lastRoll} isCrit={isCrit} />
          <View style={{ flex: 1 }}>
            <CombatLog entries={combatLog} />
          </View>
        </View>

        <View style={styles.separator} />

        {/* Hero HUD */}
        <Animated.View style={[styles.heroHud, { opacity: heroFlash }]}>
          <HeroAvatar classKey={hero.classKey} size={36} />
          <View style={styles.heroStats}>
            <Text style={[styles.heroHudName, { color: clsColor }]}>{hero.name}</Text>
            <StatBar label="HP" current={hero.hp} max={hero.maxHp} color={hero.hp < hero.maxHp * 0.3 ? Colors.hpBarLow : Colors.hpBar} height={8} />
            <StatBar label="MP" current={hero.mp} max={hero.maxMp} color={Colors.mpBar} height={6} />
          </View>
          <View style={styles.lvlBadge}>
            <Text style={[styles.lvlText, { color: clsColor }]}>Lv{hero.level}</Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <View style={styles.actionsRow}>
            <ActionButton
              label="⚔ ATTACK"
              onPress={handleAttack}
              disabled={isAnimating || combatResult !== null}
              color={Colors.primary}
            />
            <ActionButton
              label={`✨ ${clsAbility?.name?.toUpperCase() ?? 'ABILITY'}`}
              sub={`${clsAbility?.mpCost ?? 0} MP`}
              onPress={handleAbility}
              disabled={isAnimating || !canUseAbility || combatResult !== null}
              color={Colors.mpBar}
            />
          </View>
          <View style={styles.actionsRow}>
            <ActionButton
              label="🧪 POTION"
              onPress={handleUsePotion}
              disabled={isAnimating || !hasPotions || combatResult !== null}
              color={Colors.success}
            />
            <ActionButton
              label="🏃 FLEE"
              onPress={handleFlee}
              disabled={isAnimating || isBoss || combatResult !== null}
              color={Colors.warning}
            />
          </View>
        </View>

        {isAnimating && (
          <Text style={styles.waitText}>
            {phase === 'animating' ? 'Rolling...' : `${enemy.name} attacks...`}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  resultBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    backgroundColor: Colors.success + 'DD',
    paddingVertical: 14,
    alignItems: 'center',
  },
  resultBannerDeath: { backgroundColor: Colors.danger + 'DD' },
  resultWin: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelTitle, color: Colors.textPrimary, letterSpacing: 2 },
  resultDeath: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelTitle, color: Colors.textPrimary, letterSpacing: 2 },
  scroll: { padding: 16, gap: 14, paddingBottom: 36 },
  enemySection: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  enemyName: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelTitle, color: Colors.textPrimary, textAlign: 'center' },
  enemyLore: { fontFamily: Typography.fontBody, fontSize: Typography.caption, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
  enemyHpRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginTop: 4 },
  enemyHpLabel: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.textMuted, width: 20 },
  separator: { height: 1, backgroundColor: Colors.border },
  middleRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  heroHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
  },
  heroStats: { flex: 1, gap: 6 },
  heroHudName: { fontFamily: Typography.fontPixel, fontSize: 7, letterSpacing: 0.5 },
  lvlBadge: { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  lvlText: { fontFamily: Typography.fontPixel, fontSize: 7 },
  actions: { gap: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    gap: 3,
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, letterSpacing: 0.5 },
  disabledText: { color: Colors.textMuted },
  actionBtnSub: { fontFamily: Typography.fontBody, fontSize: 10, color: Colors.textMuted },
  waitText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.textMuted, textAlign: 'center', letterSpacing: 1 },
});
