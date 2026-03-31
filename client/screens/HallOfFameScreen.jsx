import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Animated, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { getHallOfFame } from '../lib/db';
import RunSummaryCard from '../components/RunSummaryCard';

export default function HallOfFameScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const data = getHallOfFame(10);
    setEntries(data);
    setLoading(false);
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.crownIcon}>🏆</Text>
          <Text style={styles.title}>HALL OF FAME</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <Text style={styles.subtitle}>The brave souls who faced the darkness.</Text>

      {!loading && entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👻</Text>
          <Text style={styles.emptyTitle}>NO LEGENDS YET</Text>
          <Text style={styles.emptySubtitle}>Complete a dungeon run to etch{'\n'}your name into history.</Text>
          <Pressable style={styles.playBtn} onPress={() => router.replace('/hero-select')}>
            <Text style={styles.playBtnText}>⚔  BEGIN A RUN</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <RunSummaryCard run={item} rank={index} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={() => (
            <Text style={styles.footerNote}>
              Top {entries.length} run{entries.length !== 1 ? 's' : ''}  ·  Ranked by rooms cleared
            </Text>
          )}
        />
      )}
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 70 },
  backText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelMicro, color: Colors.textSecondary },
  titleBlock: { alignItems: 'center', gap: 2 },
  crownIcon: { fontSize: 20 },
  title: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.secondary, letterSpacing: 1 },
  subtitle: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
    letterSpacing: 0.3,
  },
  list: { padding: 16, paddingBottom: 40 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 60,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textSecondary, letterSpacing: 1 },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  playBtn: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 6,
  },
  playBtnText: { fontFamily: Typography.fontPixel, fontSize: Typography.pixelSubtitle, color: Colors.textPrimary, letterSpacing: 1 },
  footerNote: {
    fontFamily: Typography.fontPixel,
    fontSize: 5,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.5,
  },
});
