import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function CombatLog({ entries = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [entries]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>COMBAT LOG</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        pointerEvents="none"
      >
        {entries.length === 0 ? (
          <Text style={styles.empty}>The battle begins...</Text>
        ) : (
          entries.map((entry, i) => (
            <Text key={i} style={[styles.entry, i === entries.length - 1 && styles.latest]}>
              › {entry}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 10,
    maxHeight: 120,
  },
  header: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  scroll: { flex: 1 },
  empty: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  entry: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  latest: { color: Colors.textPrimary },
});
