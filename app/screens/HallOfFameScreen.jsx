import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, HERO_CLASSES } from '../theme';

const HALL_OF_FAME_KEY = '@microrpg_hall_of_fame';

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

const EntryCard = ({ entry, index, anim }) => {
  const hero = HERO_CLASSES[entry.heroClass] || {};

  return (
    <Animated.View
      style={[
        styles.entryCard,
        entry.victory && styles.entryCardVictory,
        {
          opacity: anim,
          transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
        },
      ]}
    >
      <View style={styles.entryLeft}>
        <Text style={styles.medal}>{MEDALS[index] || '•'}</Text>
        <View>
          <View style={styles.heroRow}>
            <Text style={styles.heroEmoji}>{hero.emoji}</Text>
            <Text style={[styles.heroName, { color: hero.color }]}>{entry.heroName}</Text>
            {entry.victory && (
              <View style={styles.victoryBadge}>
                <Text style={styles.victoryBadgeText}>VICTORY</Text>
              </View>
            )}
          </View>
          <Text style={styles.dungeonName}>{entry.dungeonName}</Text>
          <Text style={styles.entryDate}>{entry.date}</Text>
        </View>
      </View>
      <View style={styles.entryRight}>
        <Text style={styles.roomsLabel}>ROOMS</Text>
        <Text style={[styles.roomsValue, entry.victory && { color: COLORS.gold }]}>
          {entry.roomsSurvived}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function HallOfFameScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const entryAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const emptyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const raw = await AsyncStorage.getItem(HALL_OF_FAME_KEY);
      const data = raw ? JSON.parse(raw) : [];
      setEntries(data);
    } catch (err) {
      console.error('Failed to load hall of fame:', err);
    } finally {
      setLoading(false);
      animateIn();
    }
  };

  const animateIn = () => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.stagger(100, entryAnims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true })
    )).start();
    Animated.timing(emptyAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  const clearHallOfFame = () => {
    Alert.alert(
      'Clear Hall of Fame',
      'Erase all records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(HALL_OF_FAME_KEY);
            setEntries([]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>🏆</Text>
          <Text style={styles.headerTitle}>HALL OF FAME</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={clearHallOfFame} disabled={entries.length === 0}>
          <Text style={[styles.clearBtnText, entries.length === 0 && { opacity: 0.3 }]}>CLEAR</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.subtitle}>The brave souls who faced the darkness.</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? null : entries.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: emptyAnim }]}>
            <Text style={styles.emptyIcon}>👻</Text>
            <Text style={styles.emptyTitle}>NO LEGENDS YET</Text>
            <Text style={styles.emptySubtitle}>Complete a dungeon run{'\n'}to etch your name here.</Text>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => navigation.navigate('HeroSelect')}
              activeOpacity={0.8}
            >
              <Text style={styles.playBtnText}>⚔  BEGIN A RUN</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            {entries.map((entry, i) => (
              <EntryCard key={entry.id} entry={entry} index={i} anim={entryAnims[i] || entryAnims[0]} />
            ))}

            <View style={styles.footer}>
              <Text style={styles.footerText}>TOP {entries.length} RUNS  ·  MAX 5 SAVED</Text>
            </View>
          </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 8,
    width: 70,
  },
  backBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.textMuted,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 1,
  },
  clearBtn: {
    padding: 8,
    width: 70,
    alignItems: 'flex-end',
  },
  clearBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    color: COLORS.red,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FONTS.pixel,
    fontSize: 5.5,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
    justifyContent: 'space-between',
  },
  entryCardVictory: {
    borderColor: COLORS.goldDark,
    backgroundColor: '#1a1508',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  medal: {
    fontSize: 22,
    marginTop: 2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  heroEmoji: {
    fontSize: 14,
  },
  heroName: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    letterSpacing: 1,
  },
  victoryBadge: {
    backgroundColor: COLORS.goldDark + '44',
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  victoryBadgeText: {
    fontFamily: FONTS.pixel,
    fontSize: 4.5,
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  dungeonName: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    color: COLORS.textMuted,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  entryDate: {
    fontFamily: FONTS.pixel,
    fontSize: 5,
    color: COLORS.textDim,
  },
  entryRight: {
    alignItems: 'center',
    marginLeft: 8,
  },
  roomsLabel: {
    fontFamily: FONTS.pixel,
    fontSize: 5,
    color: COLORS.textDim,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  roomsValue: {
    fontFamily: FONTS.pixel,
    fontSize: 20,
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 14,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: FONTS.pixel,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontFamily: FONTS.pixel,
    fontSize: 6.5,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 15,
    letterSpacing: 0.3,
  },
  playBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primaryDark,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 2,
  },
  playBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 8,
    color: COLORS.white,
    letterSpacing: 1,
  },
  footer: {
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONTS.pixel,
    fontSize: 5,
    color: COLORS.textDim,
    letterSpacing: 0.5,
  },
});
