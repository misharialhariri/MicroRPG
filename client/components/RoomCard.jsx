import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { OUTCOME_TYPES } from '../lib/constants';
import Typewriter from './Typewriter';

export default function RoomCard({ room, roomNumber, totalRooms, typing = true, onTypingComplete }) {
  if (!room) return null;
  const outcomeInfo = OUTCOME_TYPES[room.outcome_type] ?? OUTCOME_TYPES.combat;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.roomNum}>Room {roomNumber}/{totalRooms}</Text>
          <View style={[styles.typeBadge, { borderColor: outcomeInfo.color }]}>
            <Text style={[styles.typeText, { color: outcomeInfo.color }]}>
              {outcomeInfo.icon} {outcomeInfo.label}
            </Text>
          </View>
        </View>
        <Text style={styles.roomTitle}>{room.title ?? 'Unknown Chamber'}</Text>
      </View>

      <View style={styles.divider} />

      <Typewriter
        text={room.description}
        speed={22}
        onComplete={onTypingComplete}
        style={styles.description}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
  },
  header: { gap: 8, marginBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomNum: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    color: Colors.textMuted,
  },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelMicro,
    letterSpacing: 0.5,
  },
  roomTitle: {
    fontFamily: Typography.fontPixel,
    fontSize: Typography.pixelSubtitle,
    color: Colors.textAccent,
    lineHeight: Typography.pixelSubtitle * 1.8,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  description: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: Typography.bodySmall * 1.7,
  },
});
