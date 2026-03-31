import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, HERO_CLASSES, SERVER_URL } from '../theme';

const OUTCOME_ICONS = {
  combat: '⚔️',
  treasure: '💎',
  trap: '🕸️',
  rest: '🔥',
};

const OUTCOME_COLORS = {
  combat: COLORS.red,
  treasure: COLORS.gold,
  trap: '#f97316',
  rest: COLORS.green,
};

const HpBar = ({ current, max, color }) => {
  const pct = Math.max(0, current / max);
  const barColor = pct > 0.5 ? COLORS.green : pct > 0.25 ? COLORS.gold : COLORS.red;
  return (
    <View style={hpStyles.track}>
      <Animated.View style={[hpStyles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
    </View>
  );
};

const hpStyles = StyleSheet.create({
  track: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.bgPanel,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});

export default function DungeonScreen({ navigation, route }) {
  const { hero: initialHero, dungeon } = route.params;

  const [hero, setHero] = useState(initialHero);
  const [roomIndex, setRoomIndex] = useState(0);
  const [phase, setPhase] = useState('narrative'); // narrative | resolving | result | complete
  const [narration, setNarration] = useState('');
  const [resolving, setResolving] = useState(false);
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [resultType, setResultType] = useState(null); // 'win' | 'damage' | 'treasure' | 'trap' | 'rest'

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentRoom = dungeon.rooms[roomIndex];
  const hero_class = HERO_CLASSES[hero.classKey];

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    animateIn();
  }, [roomIndex]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const pulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const resolveCombat = async (room) => {
    const heroRoll = Math.floor(Math.random() * 20) + 1 + hero.attack;
    const enemyRoll = Math.floor(Math.random() * 20) + 1 + room.enemy.attack;
    const heroWon = heroRoll >= enemyRoll;

    try {
      const res = await fetch(`${SERVER_URL}/narrate-combat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroClass: hero_class.name,
          heroRoll,
          enemyName: room.enemy.name,
          enemyRoll,
          heroWon,
        }),
      });
      const data = await res.json();
      setNarration(data.narration || (heroWon ? 'Victory in combat!' : 'You took a heavy blow.'));
    } catch {
      setNarration(heroWon ? 'You struck true and vanquished the foe!' : 'The enemy landed a brutal hit!');
    }

    if (heroWon) {
      setResultType('win');
      pulse();
      return { survived: true, damage: 0 };
    } else {
      const dmg = Math.max(1, room.enemy.attack - hero.defense + Math.floor(Math.random() * 6));
      shake();
      setResultType('damage');
      return { survived: true, damage: dmg };
    }
  };

  const handleChoice = async (choiceIndex) => {
    if (resolving) return;
    setResolving(true);
    setPhase('resolving');

    const room = currentRoom;
    let damage = 0;
    let survived = true;

    if (room.outcome_type === 'combat') {
      const result = await resolveCombat(room);
      damage = result.damage;
    } else if (room.outcome_type === 'trap') {
      damage = Math.floor(Math.random() * 15) + 5;
      setNarration('The trap springs! Poison darts slice through the air.');
      shake();
      setResultType('trap');
    } else if (room.outcome_type === 'treasure') {
      const heal = Math.floor(Math.random() * 15) + 5;
      damage = -heal; // negative = heal
      setNarration('Ancient treasure! A healing rune mends your wounds.');
      pulse();
      setResultType('treasure');
    } else if (room.outcome_type === 'rest') {
      const heal = Math.floor(Math.random() * 20) + 10;
      damage = -heal;
      setNarration('A brief respite. The warmth of embers soothes your wounds.');
      pulse();
      setResultType('rest');
    }

    const newHp = Math.min(hero.maxHp, hero.hp - damage);
    setHero((h) => ({ ...h, hp: newHp }));

    if (newHp <= 0) {
      const cause =
        room.outcome_type === 'combat'
          ? `Slain by ${room.enemy?.name ?? 'a dungeon creature'}`
          : room.outcome_type === 'trap'
          ? 'Killed by a dungeon trap'
          : 'Fell in the dungeon';
      setCauseOfDeath(cause);
      survived = false;
    }

    setPhase('result');
    setResolving(false);

    if (!survived) {
      setTimeout(() => {
        navigation.replace('GameOver', {
          hero: { ...hero, hp: 0 },
          dungeon,
          roomsSurvived: roomIndex,
          causeOfDeath: cause,
        });
      }, 2200);
    }
  };

  const handleNextRoom = () => {
    if (roomIndex >= dungeon.rooms.length - 1) {
      // Dungeon complete!
      navigation.replace('GameOver', {
        hero,
        dungeon,
        roomsSurvived: dungeon.rooms.length,
        causeOfDeath: null,
        victory: true,
      });
      return;
    }
    setPhase('narrative');
    setNarration('');
    setResultType(null);
    setRoomIndex((i) => i + 1);
  };

  const outcomeColor = currentRoom ? OUTCOME_COLORS[currentRoom.outcome_type] : COLORS.primary;

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <Text style={[styles.hudHeroName, { color: hero_class?.color }]}>
            {hero_class?.emoji} {hero_class?.name}
          </Text>
          <View style={styles.hpRow}>
            <Text style={styles.hpLabel}>HP</Text>
            <HpBar current={hero.hp} max={hero.maxHp} />
            <Text style={[styles.hpValue, { color: hero.hp < hero.maxHp * 0.25 ? COLORS.red : COLORS.text }]}>
              {hero.hp}/{hero.maxHp}
            </Text>
          </View>
        </View>
        <View style={styles.hudRight}>
          <Text style={styles.roomCounter}>
            ROOM{'\n'}{roomIndex + 1}/{dungeon.rooms.length}
          </Text>
        </View>
      </View>

      {/* Room progress dots */}
      <View style={styles.progressDots}>
        {dungeon.rooms.map((r, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < roomIndex && { backgroundColor: COLORS.textMuted },
              i === roomIndex && { backgroundColor: COLORS.primary, width: 18 },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Room card */}
        <Animated.View
          style={[
            styles.roomCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] },
          ]}
        >
          {/* Dungeon name & room type */}
          <View style={styles.roomMeta}>
            <Text style={styles.dungeonName}>{dungeon.dungeon_name}</Text>
            <View style={[styles.outcomeTag, { borderColor: outcomeColor }]}>
              <Text style={[styles.outcomeTagText, { color: outcomeColor }]}>
                {OUTCOME_ICONS[currentRoom?.outcome_type]}  {currentRoom?.outcome_type?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Room description */}
          <Text style={styles.roomDescription}>{currentRoom?.description}</Text>

          {/* Enemy info if combat */}
          {currentRoom?.outcome_type === 'combat' && currentRoom?.enemy && phase === 'narrative' && (
            <Animated.View style={[styles.enemyBox, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.enemyLabel}>ENEMY ENCOUNTERED</Text>
              <Text style={styles.enemyName}>{currentRoom.enemy.name}</Text>
              <View style={styles.enemyStats}>
                <Text style={styles.enemyStat}>❤️ {currentRoom.enemy.hp} HP</Text>
                <Text style={styles.enemyStat}>⚔️ {currentRoom.enemy.attack} ATK</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* Result / Narration */}
        {phase === 'result' && narration ? (
          <Animated.View
            style={[
              styles.narrationBox,
              resultType === 'win' && { borderColor: COLORS.green },
              resultType === 'damage' && { borderColor: COLORS.red },
              resultType === 'treasure' && { borderColor: COLORS.gold },
              resultType === 'rest' && { borderColor: COLORS.green },
              resultType === 'trap' && { borderColor: '#f97316' },
              { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.narrationIcon}>
              {resultType === 'win' ? '✅' : resultType === 'damage' ? '💢' : resultType === 'treasure' ? '💎' : resultType === 'trap' ? '🕸️' : '🔥'}
            </Text>
            <Text style={styles.narrationText}>{narration}</Text>
            {resultType === 'damage' && (
              <Text style={styles.damageText}>HP: {hero.hp}/{hero.maxHp}</Text>
            )}
            {(resultType === 'treasure' || resultType === 'rest') && (
              <Text style={styles.healText}>HP: {hero.hp}/{hero.maxHp}</Text>
            )}
          </Animated.View>
        ) : null}

        {/* Loading */}
        {phase === 'resolving' && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>RESOLVING...</Text>
          </View>
        )}

        {/* Choice buttons */}
        {phase === 'narrative' && (
          <View style={styles.choicesContainer}>
            <Text style={styles.choicesLabel}>WHAT DO YOU DO?</Text>
            {currentRoom?.choices?.map((choice, i) => (
              <TouchableOpacity
                key={i}
                style={styles.choiceBtn}
                onPress={() => handleChoice(i)}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceNumber}>{i + 1}</Text>
                <Text style={styles.choiceText}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Next room button */}
        {phase === 'result' && hero.hp > 0 && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextRoom} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              {roomIndex >= dungeon.rooms.length - 1 ? '🏆  CLAIM VICTORY' : '→  NEXT ROOM'}
            </Text>
          </TouchableOpacity>
        )}

        {phase === 'result' && hero.hp <= 0 && (
          <View style={styles.deathBox}>
            <Text style={styles.deathText}>YOU HAVE FALLEN...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  hudLeft: {
    flex: 1,
    gap: 6,
  },
  hudHeroName: {
    fontFamily: FONTS.pixel,
    fontSize: 8,
    letterSpacing: 1,
  },
  hpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hpLabel: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    color: COLORS.textMuted,
    width: 18,
  },
  hpValue: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    minWidth: 48,
    textAlign: 'right',
  },
  hudRight: {
    alignItems: 'center',
    marginLeft: 16,
  },
  roomCounter: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 14,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  roomCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 18,
  },
  roomMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dungeonName: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    color: COLORS.textDim,
    flex: 1,
    letterSpacing: 0.5,
  },
  outcomeTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    marginLeft: 8,
  },
  outcomeTagText: {
    fontFamily: FONTS.pixel,
    fontSize: 5.5,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  roomDescription: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.text,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  enemyBox: {
    marginTop: 14,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 2,
    padding: 12,
    alignItems: 'center',
  },
  enemyLabel: {
    fontFamily: FONTS.pixel,
    fontSize: 5.5,
    color: COLORS.red,
    letterSpacing: 1,
    marginBottom: 6,
  },
  enemyName: {
    fontFamily: FONTS.pixel,
    fontSize: 11,
    color: COLORS.text,
    marginBottom: 8,
  },
  enemyStats: {
    flexDirection: 'row',
    gap: 16,
  },
  enemyStat: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.textMuted,
  },
  narrationBox: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  narrationIcon: {
    fontSize: 24,
  },
  narrationText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  damageText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.red,
    marginTop: 4,
  },
  healText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.green,
    marginTop: 4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  choicesContainer: {
    gap: 10,
  },
  choicesLabel: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    color: COLORS.textDim,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    borderRadius: 2,
    padding: 14,
    gap: 12,
  },
  choiceNumber: {
    fontFamily: FONTS.pixel,
    fontSize: 8,
    color: COLORS.primary,
    minWidth: 14,
  },
  choiceText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.text,
    flex: 1,
    lineHeight: 15,
    letterSpacing: 0.3,
  },
  nextBtn: {
    backgroundColor: COLORS.primaryDark,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  nextBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    color: COLORS.white,
    letterSpacing: 1,
  },
  deathBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  deathText: {
    fontFamily: FONTS.pixel,
    fontSize: 10,
    color: COLORS.red,
    letterSpacing: 2,
    textShadowColor: COLORS.red,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
