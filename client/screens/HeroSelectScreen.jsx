import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { HERO_CLASSES } from '../lib/constants';
import { generateDungeon } from '../lib/api';
import { useGame } from '../hooks/useGame';
import StatBar from '../components/StatBar';
import HeroAvatar from '../components/HeroAvatar';

const LORE_QUOTES = [
  '"Only the worthy may enter. None have returned to say if they were."',
  '"The dungeon does not sleep. It waits."',
  '"Every torch cast into the dark is an act of defiance against oblivion."',
  '"Steel your heart. The abyss has no mercy for the hesitant."',
];

function HeroCard({ classKey, selected, onSelect }) {
  const cls = HERO_CLASSES[classKey];
  const color = Colors[cls.colorKey];
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => onSelect(classKey));
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.heroCard,
          selected && { borderColor: color, shadowColor: color, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
          { transform: [{ scale }] },
        ]}
      >
        {selected && <View style={[styles.selectedBar, { backgroundColor: color }]} />}
        <View style={styles.cardTop}>
          <HeroAvatar classKey={classKey} size={52} />
          <View style={styles.cardMeta}>
            <Text style={[styles.className, { color }]}>{cls.name}</Text>
            <Text style={styles.classLore}>{cls.lore}</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <StatBar label="HP" current={cls.hp} max={120} color={Colors.hpBar} />
          <StatBar label="MP" current={cls.mp} max={100} color={Colors.mpBar} />
          <StatBar label="ATK" current={cls.attack} max={20} color={Colors.secondary} />
          <StatBar label="DEF" current={cls.defense} max={12} color={Colors.success} />
          <StatBar label="SPD" current={cls.speed} max={16} color={Colors.info} />
        </View>

        <View style={styles.abilitiesSection}>
          <View style={[styles.abilityChip, { borderColor: color }]}>
            <Text style={styles.abilityIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.abilityName, { color }]}>{cls.ability.name}</Text>
              <Text style={styles.abilityDesc}>{cls.ability.description}  ({cls.ability.mpCost} MP)</Text>
            </View>
          </View>
          <View style={styles.passiveChip}>
            <Text style={styles.abilityIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.passiveName}>{cls.passive.name}</Text>
              <Text style={styles.abilityDesc}>{cls.passive.description}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function HeroSelectScreen() {
  const [selected, setSelected] = useState(null);
  const [heroName, setHeroName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loreIdx, setLoreIdx] = useState(0);
  const { startGame, setDungeon } = useGame();

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    setLoreIdx(Math.floor(Math.random() * LORE_QUOTES.length));
  }, []);

  const handleEnter = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const cls = HERO_CLASSES[selected];
      const dungeon = await generateDungeon(selected, {
        hp: cls.hp, attack: cls.attack, defense: cls.defense,
        speed: cls.speed, magic: cls.magic,
      });
      startGame(heroName.trim() || 'Hero', selected);
      setDungeon(dungeon);
      router.replace('/dungeon');
    } catch (err) {
      Alert.alert(
        'The dungeon magic flickered...',
        err.message ?? 'Could not generate dungeon. Check server connection.',
        [{ text: 'Retry', onPress: handleEnter }, { text: 'Cancel', style: 'cancel' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.title}>CHOOSE YOUR HERO</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(HERO_CLASSES).map((k) => (
          <HeroCard key={k} classKey={k} selected={selected === k} onSelect={setSelected} />
        ))}

        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>HERO NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={heroName}
            onChangeText={setHeroName}
            placeholder="Enter your name..."
            placeholderTextColor={Colors.textMuted}
            maxLength={20}
          />
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.loadingText}>Forging your dungeon...</Text>
            <Text style={styles.loreQuote}>{LORE_QUOTES[loreIdx]}</Text>
          </View>
        )}

        <Pressable
          style={[styles.enterBtn, (!selected || loading) && styles.enterBtnDisabled]}
          onPress={handleEnter}
          disabled={!selected || loading}
        >
          <Text style={styles.enterBtnText}>
            {loading ? 'GENERATING...' : selected ? `ENTER AS ${HERO_CLASSES[selected].name.toUpperCase()}` : 'SELECT A HERO'}
          </Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 70 },
  backText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.textSecondary },
  title: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.secondary, letterSpacing: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  selectedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardMeta: { flex: 1, gap: 4 },
  className: { fontFamily: Typography.fontPixel, fontSize: 12, letterSpacing: 1 },
  classLore: { fontFamily: Typography.fontBody, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 17 },
  statsSection: { gap: 7 },
  abilitiesSection: { gap: 8 },
  abilityChip: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    alignItems: 'flex-start',
  },
  passiveChip: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 8,
    alignItems: 'flex-start',
  },
  abilityIcon: { fontSize: 14 },
  abilityName: { fontFamily: Typography.fontPixel, fontSize: 6, letterSpacing: 0.5, marginBottom: 3 },
  passiveName: { fontFamily: Typography.fontPixel, fontSize: 6, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 3 },
  abilityDesc: { fontFamily: Typography.fontBody, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 16 },
  nameSection: { gap: 8 },
  nameLabel: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.textSecondary, letterSpacing: 1 },
  nameInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  loadingText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.primary },
  loreQuote: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  enterBtn: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 18,
    alignItems: 'center',
  },
  enterBtnDisabled: { opacity: 0.45, backgroundColor: Colors.surface, borderColor: Colors.border },
  enterBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textPrimary, letterSpacing: 1 },
});
