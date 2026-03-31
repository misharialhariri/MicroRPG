import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
  Animated, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { HERO_CLASSES } from '../lib/constants';
import { narrateRoomOutcome } from '../lib/api';
import { dodgeCheck, rollD20 } from '../lib/gameEngine';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import StatBar from '../components/StatBar';
import RoomCard from '../components/RoomCard';
import ChoiceButton from '../components/ChoiceButton';
import HeroAvatar from '../components/HeroAvatar';

function InventoryModal({ visible, inventory, onClose, onUseItem }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>INVENTORY</Text>
          {inventory.length === 0 ? (
            <Text style={styles.emptyInv}>No items.</Text>
          ) : (
            inventory.map((item, i) => (
              <Pressable key={i} style={styles.itemRow} onPress={() => onUseItem(i, item)}>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemEffect}>{item.effect}</Text>
                </View>
                <Text style={styles.useLabel}>USE</Text>
              </Pressable>
            ))
          )}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function DungeonScreen() {
  const game = useGame();
  const { hero, dungeon, currentRoom, currentRoomIndex, inventory, setLastEnemy } = game;
  const { play } = useSound();

  const [choiceMade, setChoiceMade] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [outcomeText, setOutcomeText] = useState('');
  const [showInv, setShowInv] = useState(false);

  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const clsData = HERO_CLASSES[hero?.classKey];
  const clsColor = clsData ? Colors[clsData.colorKey] : Colors.primary;

  useEffect(() => {
    if (!dungeon || !hero) {
      router.replace('/');
      return;
    }
    animateIn();
    setChoiceMade(false);
    setOutcomeText('');
    setResolving(false);
  }, [currentRoomIndex]);

  function animateIn() {
    slideAnim.setValue(60);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }

  async function handleChoice(choice) {
    if (choiceMade || resolving) return;
    setChoiceMade(true);
    setResolving(true);

    const room = currentRoom;
    const type = room.outcome_type;

    if (type === 'combat' || type === 'boss') {
      setLastEnemy(room.enemy);
      router.push('/combat');
      setResolving(false);
      return;
    }

    if (type === 'treasure') {
      router.push('/treasure');
      setResolving(false);
      return;
    }

    // Handle trap and rest inline
    if (type === 'trap') {
      await resolveTrap(room.trap);
    } else if (type === 'rest') {
      await resolveRest(room.rest_bonus);
    }
    setResolving(false);
  }

  async function resolveTrap(trap) {
    let narration = '';
    if (!trap) { setResolving(false); return; }

    if (trap.can_dodge) {
      const dodged = dodgeCheck(hero.speed);
      if (dodged) {
        narration = `You dodge the ${trap.name}! No damage taken.`;
        play('hit');
      } else {
        game.damageHero(trap.damage);
        narration = `${trap.name} hits for ${trap.damage} damage!`;
        play('hit');
        if (hero.hp - trap.damage <= 0) {
          router.replace('/game-over');
          return;
        }
      }
    } else {
      game.damageHero(trap.damage);
      narration = `${trap.name} — inescapable! You take ${trap.damage} damage.`;
      play('hit');
      if (hero.hp - trap.damage <= 0) {
        router.replace('/game-over');
        return;
      }
    }

    try {
      const aiNarration = await narrateRoomOutcome('trap', narration, hero);
      setOutcomeText(aiNarration || narration);
    } catch {
      setOutcomeText(narration);
    }
  }

  async function resolveRest(bonus) {
    if (!bonus) { setResolving(false); return; }
    const healed = game.healHero(bonus.hp_restored);
    game.restoreMP(bonus.mp_restored);
    const narration = bonus.flavor_text || `You rest and recover ${bonus.hp_restored} HP and ${bonus.mp_restored} MP.`;
    setOutcomeText(narration);
  }

  function handleContinue() {
    if (currentRoomIndex >= (dungeon?.rooms?.length ?? 0) - 1) {
      game.triggerVictory();
      router.replace('/victory');
    } else {
      game.advanceRoom();
    }
  }

  function handleUseItem(index, item) {
    if (item.type === 'potion') {
      game.healHero(item.statBoost.amount);
      game.removeItem(index);
      Alert.alert('Potion used', `Restored ${item.statBoost.amount} HP.`);
    }
    setShowInv(false);
  }

  if (!hero || !dungeon || !currentRoom) return null;

  const totalRooms = dungeon.rooms.length;
  const showContinue = choiceMade && !resolving && (outcomeText || currentRoom.outcome_type === 'treasure');

  return (
    <View style={styles.container}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <HeroAvatar classKey={hero.classKey} size={36} />
          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: clsColor }]}>{hero.name}</Text>
            <StatBar label="HP" current={hero.hp} max={hero.maxHp} color={hero.hp < hero.maxHp * 0.3 ? Colors.hpBarLow : Colors.hpBar} height={7} />
            <StatBar label="MP" current={hero.mp} max={hero.maxMp} color={Colors.mpBar} height={6} />
          </View>
        </View>
        <View style={styles.hudRight}>
          <View style={[styles.lvlBadge, { borderColor: clsColor }]}>
            <Text style={[styles.lvlText, { color: clsColor }]}>Lv{hero.level}</Text>
          </View>
          <Text style={styles.goldText}>⚙ {hero.gold}</Text>
        </View>
      </View>

      {/* Room progress */}
      <View style={styles.progressRow}>
        {dungeon.rooms.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentRoomIndex && styles.dotCleared,
              i === currentRoomIndex && styles.dotCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <RoomCard
            room={currentRoom}
            roomNumber={currentRoomIndex + 1}
            totalRooms={totalRooms}
            typing={!choiceMade}
          />
        </Animated.View>

        {/* Outcome text */}
        {outcomeText ? (
          <View style={styles.outcomeBox}>
            <Text style={styles.outcomeText}>{outcomeText}</Text>
          </View>
        ) : null}

        {/* Choices */}
        {!choiceMade && currentRoom.choices?.map((c, i) => (
          <ChoiceButton
            key={i}
            index={i}
            text={c.text}
            onPress={() => handleChoice(c)}
            disabled={resolving}
          />
        ))}

        {/* Continue after trap/rest */}
        {choiceMade && outcomeText && (
          <Pressable style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>
              {currentRoomIndex >= totalRooms - 1 ? '🏆  FINAL ROOM CLEARED' : '→  NEXT ROOM'}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Inventory row */}
      <Pressable style={styles.invBar} onPress={() => setShowInv(true)}>
        <Text style={styles.invLabel}>BAG  ({inventory.length}/5)</Text>
        {inventory.map((item, i) => (
          <Text key={i} style={styles.invItem}>{item.emoji}</Text>
        ))}
        {inventory.length === 0 && <Text style={styles.invEmpty}>Empty</Text>}
      </Pressable>

      <InventoryModal
        visible={showInv}
        inventory={inventory}
        onClose={() => setShowInv(false)}
        onUseItem={handleUseItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  hudLeft: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  heroInfo: { flex: 1, gap: 5 },
  heroName: { fontFamily: Typography.fontPixel, fontSize: 7, letterSpacing: 0.5 },
  hudRight: { alignItems: 'center', gap: 6 },
  lvlBadge: {
    borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  lvlText: { fontFamily: Typography.fontPixel, fontSize: 7 },
  goldText: { fontFamily: Typography.fontPixel, fontSize: 7, color: Colors.secondary },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.textMuted },
  dotCleared: { backgroundColor: Colors.success },
  dotCurrent: { backgroundColor: Colors.primary, width: 18 },
  scroll: { padding: 14, gap: 12, paddingBottom: 20 },
  outcomeBox: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 14,
  },
  outcomeText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: Typography.bodySmall * 1.7,
    fontStyle: 'italic',
  },
  continueBtn: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  continueBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textPrimary, letterSpacing: 1 },
  invBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  invLabel: { fontFamily: Typography.fontPixel, fontSize: 6, color: Colors.textMuted },
  invItem: { fontSize: 22 },
  invEmpty: { fontFamily: Typography.fontBody, fontSize: Typography.caption, color: Colors.textMuted, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', paddingHorizontal: 20 },
  modalBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textAccent, textAlign: 'center' },
  emptyInv: { fontFamily: Typography.fontBody, fontSize: Typography.bodySmall, color: Colors.textMuted, textAlign: 'center', padding: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 6,
    padding: 10,
  },
  itemEmoji: { fontSize: 24 },
  itemName: { fontFamily: Typography.fontPixel, fontSize: 7, color: Colors.textPrimary, marginBottom: 3 },
  itemEffect: { fontFamily: Typography.fontBody, fontSize: Typography.caption, color: Colors.textSecondary },
  useLabel: { fontFamily: Typography.fontPixel, fontSize: 6, color: Colors.primary },
  closeBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.textSecondary },
});
