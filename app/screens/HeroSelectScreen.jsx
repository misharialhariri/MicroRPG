import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, FONTS, HERO_CLASSES, SERVER_URL } from '../theme';

const StatBar = ({ label, value, max, color }) => {
  const width = `${(value / max) * 100}%`;
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
};

const HeroCard = ({ classKey, selected, onPress }) => {
  const hero = HERO_CLASSES[classKey];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => onPress(classKey));
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.heroCard,
          selected && { borderColor: hero.color, shadowColor: hero.color },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {selected && (
          <View style={[styles.selectedBadge, { backgroundColor: hero.color }]}>
            <Text style={styles.selectedBadgeText}>SELECTED</Text>
          </View>
        )}
        <Text style={styles.heroEmoji}>{hero.emoji}</Text>
        <Text style={[styles.heroName, { color: hero.color }]}>{hero.name}</Text>
        <Text style={styles.heroFlavor}>{hero.flavor}</Text>
        <Text style={styles.heroDescription}>{hero.description}</Text>

        <View style={styles.statsContainer}>
          <StatBar label="HP" value={hero.stats.hp} max={120} color={COLORS.red} />
          <StatBar label="ATK" value={hero.stats.attack} max={20} color={COLORS.gold} />
          <StatBar label="DEF" value={hero.stats.defense} max={8} color={COLORS.blue} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HeroSelectScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleBegin = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/generate-dungeon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroClass: selected }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }

      const dungeon = await res.json();
      const hero = {
        classKey: selected,
        ...HERO_CLASSES[selected].stats,
        maxHp: HERO_CLASSES[selected].stats.hp,
        name: HERO_CLASSES[selected].name,
      };

      navigation.navigate('Dungeon', { hero, dungeon });
    } catch (err) {
      Alert.alert('Failed to generate dungeon', err.message);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>CHOOSE YOUR HERO</Text>
        <View style={{ width: 60 }} />
      </Animated.View>

      <Text style={styles.headerSubtitle}>Your fate begins with your choice.</Text>

      {/* Hero Cards */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: cardsAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(HERO_CLASSES).map((classKey) => (
          <HeroCard
            key={classKey}
            classKey={classKey}
            selected={selected === classKey}
            onPress={setSelected}
          />
        ))}

        {/* Begin Button */}
        <TouchableOpacity
          style={[
            styles.beginBtn,
            !selected && styles.beginBtnDisabled,
            selected && { borderColor: HERO_CLASSES[selected]?.color },
          ]}
          onPress={handleBegin}
          disabled={!selected || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={[styles.beginBtnText, { marginLeft: 12 }]}>FORGING DUNGEON...</Text>
            </View>
          ) : (
            <Text style={[styles.beginBtnText, !selected && { color: COLORS.textDim }]}>
              {selected ? `DESCEND AS ${HERO_CLASSES[selected].name.toUpperCase()}` : 'SELECT A HERO'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.ScrollView>
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
    width: 80,
  },
  backBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.textMuted,
  },
  headerTitle: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    color: COLORS.gold,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 10,
    elevation: 3,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  selectedBadgeText: {
    fontFamily: FONTS.pixel,
    fontSize: 5,
    color: COLORS.bg,
    letterSpacing: 1,
  },
  heroEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  heroName: {
    fontFamily: FONTS.pixel,
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroFlavor: {
    fontFamily: FONTS.pixel,
    fontSize: 5.5,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  heroDescription: {
    fontFamily: FONTS.pixel,
    fontSize: 6.5,
    color: COLORS.text,
    lineHeight: 14,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  statsContainer: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontFamily: FONTS.pixel,
    fontSize: 6,
    color: COLORS.textMuted,
    width: 28,
  },
  statTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bgPanel,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 3,
  },
  statValue: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    width: 30,
    textAlign: 'right',
  },
  beginBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primaryDark,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  beginBtnDisabled: {
    backgroundColor: COLORS.bgPanel,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  beginBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 8,
    color: COLORS.white,
    letterSpacing: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
