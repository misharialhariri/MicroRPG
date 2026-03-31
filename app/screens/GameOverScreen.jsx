import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, HERO_CLASSES } from '../theme';

const HALL_OF_FAME_KEY = '@microrpg_hall_of_fame';

async function saveRun(hero, dungeon, roomsSurvived, victory) {
  try {
    const raw = await AsyncStorage.getItem(HALL_OF_FAME_KEY);
    const entries = raw ? JSON.parse(raw) : [];

    const newEntry = {
      id: Date.now(),
      heroClass: hero.classKey,
      heroName: HERO_CLASSES[hero.classKey].name,
      dungeonName: dungeon.dungeon_name,
      roomsSurvived,
      victory: !!victory,
      date: new Date().toLocaleDateString(),
    };

    // Add and keep top 5 by rooms survived (victories first)
    entries.push(newEntry);
    entries.sort((a, b) => {
      if (a.victory !== b.victory) return b.victory ? 1 : -1;
      return b.roomsSurvived - a.roomsSurvived;
    });
    const top5 = entries.slice(0, 5);

    await AsyncStorage.setItem(HALL_OF_FAME_KEY, JSON.stringify(top5));
  } catch (err) {
    console.error('Failed to save run:', err);
  }
}

export default function GameOverScreen({ navigation, route }) {
  const { hero, dungeon, roomsSurvived, causeOfDeath, victory } = route.params;
  const hero_class = HERO_CLASSES[hero.classKey];

  const bgAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const skullAnim = useRef(new Animated.Value(0)).current;
  const skullFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    saveRun(hero, dungeon, roomsSurvived, victory);

    Animated.stagger(200, [
      Animated.timing(bgAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(skullAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(skullFloat, { toValue: -8, duration: 1600, useNativeDriver: true }),
        Animated.timing(skullFloat, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getRank = (rooms) => {
    if (victory) return { label: 'LEGEND', color: COLORS.gold };
    if (rooms >= 4) return { label: 'VETERAN', color: '#c084fc' };
    if (rooms >= 2) return { label: 'CHALLENGER', color: COLORS.blue };
    return { label: 'FALLEN', color: COLORS.textMuted };
  };

  const rank = getRank(roomsSurvived);

  return (
    <Animated.View style={[styles.container, { opacity: bgAnim }]}>
      {/* Skull / Trophy */}
      <Animated.View
        style={{
          transform: [
            { scale: skullAnim },
            { translateY: skullFloat },
          ],
        }}
      >
        <Text style={styles.mainIcon}>{victory ? '🏆' : '💀'}</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View
        style={{
          opacity: titleAnim,
          transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          alignItems: 'center',
        }}
      >
        <Text style={[styles.title, victory && styles.victoryTitle]}>
          {victory ? 'DUNGEON CLEARED' : 'YOU HAVE FALLEN'}
        </Text>
        <View style={[styles.rankBadge, { backgroundColor: rank.color + '22', borderColor: rank.color }]}>
          <Text style={[styles.rankText, { color: rank.color }]}>{rank.label}</Text>
        </View>
      </Animated.View>

      {/* Stats panel */}
      <Animated.View
        style={[
          styles.statsPanel,
          {
            opacity: statsAnim,
            transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>HERO</Text>
          <Text style={[styles.statValue, { color: hero_class?.color }]}>
            {hero_class?.emoji} {hero_class?.name}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>DUNGEON</Text>
          <Text style={styles.statValue}>{dungeon.dungeon_name}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>ROOMS SURVIVED</Text>
          <Text style={[styles.statValue, styles.statValueLarge]}>
            {roomsSurvived}/{dungeon.rooms.length}
          </Text>
        </View>
        {!victory && causeOfDeath && (
          <>
            <View style={styles.divider} />
            <View style={styles.causeRow}>
              <Text style={styles.statLabel}>CAUSE OF DEATH</Text>
              <Text style={[styles.causeText]}>{causeOfDeath}</Text>
            </View>
          </>
        )}
      </Animated.View>

      {/* Epitaph */}
      <Animated.Text style={[styles.epitaph, { opacity: statsAnim }]}>
        {victory
          ? 'Your legend will echo through these halls.'
          : '"Few descend. Fewer return. None are forgotten."'}
      </Animated.Text>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonGroup,
          {
            opacity: btnAnim,
            transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('HeroSelect')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>⚔  PLAY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('HallOfFame')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>🏆  HALL OF FAME</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.tertiaryBtnText}>HOME</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  mainIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontFamily: FONTS.pixel,
    fontSize: 14,
    color: COLORS.red,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: COLORS.red,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    marginBottom: 10,
  },
  victoryTitle: {
    color: COLORS.gold,
    textShadowColor: COLORS.gold,
  },
  rankBadge: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 2,
  },
  rankText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    letterSpacing: 2,
  },
  statsPanel: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 16,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  causeRow: {
    gap: 6,
  },
  statLabel: {
    fontFamily: FONTS.pixel,
    fontSize: 5.5,
    color: COLORS.textDim,
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  statValueLarge: {
    fontSize: 10,
    color: COLORS.primary,
  },
  causeText: {
    fontFamily: FONTS.pixel,
    fontSize: 6.5,
    color: COLORS.red,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  epitaph: {
    fontFamily: FONTS.pixel,
    fontSize: 5.5,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 13,
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryDark,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 2,
  },
  primaryBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    color: COLORS.white,
    letterSpacing: 1,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 2,
  },
  secondaryBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  tertiaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  tertiaryBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
});
