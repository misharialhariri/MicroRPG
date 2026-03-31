import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MAX_INVENTORY } from '../lib/constants';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';

const TYPE_COLORS = {
  weapon: Colors.danger,
  armor: Colors.info,
  potion: Colors.success,
  relic: Colors.secondary,
};
const TYPE_ICONS = { weapon: '⚔️', armor: '🛡️', potion: '🧪', relic: '🔮' };

export default function TreasureScreen() {
  const game = useGame();
  const { hero, currentRoom, dungeon, currentRoomIndex, inventory, addItem, advanceRoom, triggerVictory } = game;
  const { play } = useSound();

  const [revealed, setRevealed] = useState(false);
  const [added, setAdded] = useState(false);
  const chestScale = useRef(new Animated.Value(1)).current;
  const itemOpacity = useRef(new Animated.Value(0)).current;
  const itemScale = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const treasure = currentRoom?.treasure;
  const isFull = inventory.length >= MAX_INVENTORY;
  const totalRooms = dungeon?.rooms?.length ?? 5;

  useEffect(() => {
    if (!treasure) {
      handleContinue();
    }
  }, []);

  function openChest() {
    play('treasure');
    Animated.sequence([
      Animated.spring(chestScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(chestScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(itemOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(itemScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    setRevealed(true);
  }

  function handleAddItem() {
    if (!treasure || isFull || added) return;
    const item = {
      id: `${treasure.item_type}_${Date.now()}`,
      name: treasure.item_name,
      type: treasure.item_type,
      emoji: TYPE_ICONS[treasure.item_type] ?? '✨',
      effect: treasure.effect,
      statBoost: treasure.stat_boost ?? { stat: 'none', amount: 0 },
    };

    // Apply weapon/armor stat boosts immediately
    if (treasure.stat_boost && (item.type === 'weapon' || item.type === 'armor' || item.type === 'relic')) {
      const stat = treasure.stat_boost.stat;
      const amount = treasure.stat_boost.amount;
      if (stat && amount) {
        game.updateHero({ [stat]: (hero?.[stat] ?? 0) + amount });
      }
    }

    addItem(item);
    setAdded(true);
  }

  function handleContinue() {
    if (currentRoomIndex >= totalRooms - 1) {
      triggerVictory();
      router.replace('/victory');
    } else {
      advanceRoom();
      router.replace('/dungeon');
    }
  }

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const typeColor = treasure ? (TYPE_COLORS[treasure.item_type] ?? Colors.secondary) : Colors.secondary;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TREASURE FOUND</Text>

      <Animated.Text style={[styles.chestEmoji, { transform: [{ scale: chestScale }] }]}>
        {revealed ? '📦' : '🎁'}
      </Animated.Text>

      {!revealed ? (
        <>
          <Text style={styles.hint}>Tap the chest to reveal your reward</Text>
          <Pressable style={styles.revealBtn} onPress={openChest}>
            <Text style={styles.revealBtnText}>✨  OPEN CHEST</Text>
          </Pressable>
        </>
      ) : (
        <Animated.View style={[styles.itemCard, { opacity: itemOpacity, transform: [{ scale: itemScale }] }]}>
          <Animated.View style={[styles.itemGlow, { borderColor: typeColor, opacity: glowOpacity }]} />
          <Text style={styles.itemEmoji}>{TYPE_ICONS[treasure?.item_type] ?? '✨'}</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '33', borderColor: typeColor }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {treasure?.item_type?.toUpperCase() ?? 'ITEM'}
            </Text>
          </View>
          <Text style={styles.itemName}>{treasure?.item_name}</Text>
          <Text style={styles.itemEffect}>{treasure?.effect}</Text>
          {treasure?.stat_boost && (
            <Text style={styles.statBoost}>
              +{treasure.stat_boost.amount} {treasure.stat_boost.stat?.toUpperCase()}
            </Text>
          )}
        </Animated.View>
      )}

      {revealed && (
        <View style={styles.actions}>
          {!added && (
            <Pressable
              style={[styles.addBtn, isFull && styles.addBtnDisabled]}
              onPress={handleAddItem}
              disabled={isFull || added}
            >
              <Text style={styles.addBtnText}>
                {isFull ? '⚠  BAG FULL (5/5)' : '+ ADD TO INVENTORY'}
              </Text>
            </Pressable>
          )}
          {added && <Text style={styles.addedText}>✅  Added to inventory</Text>}
          <Pressable style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>
              {currentRoomIndex >= totalRooms - 1 ? '🏆  FINAL ROOM CLEARED' : '→  CONTINUE'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 20,
  },
  title: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelTitle,
    color: Colors.secondary,
    letterSpacing: 2,
  },
  chestEmoji: { fontSize: 80 },
  hint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  revealBtn: {
    backgroundColor: Colors.secondaryDark,
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  revealBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textPrimary, letterSpacing: 1 },
  itemCard: {
    width: '100%',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  itemGlow: {
    position: 'absolute',
    inset: 0,
    borderWidth: 2,
    borderRadius: 12,
  },
  itemEmoji: { fontSize: 52 },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, letterSpacing: 1 },
  itemName: { fontFamily: Typography.fontPixel, fontSize: 10, color: Colors.textPrimary, textAlign: 'center', letterSpacing: 1 },
  itemEffect: { fontFamily: Typography.fontBody, fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  statBoost: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.success },
  actions: { width: '100%', gap: 10 },
  addBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.success,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnDisabled: { borderColor: Colors.danger, opacity: 0.6 },
  addBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.success, letterSpacing: 1 },
  addedText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.success, textAlign: 'center' },
  continueBtn: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textPrimary, letterSpacing: 1 },
});
