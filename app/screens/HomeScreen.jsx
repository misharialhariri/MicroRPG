import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { COLORS, FONTS } from '../theme';

export default function HomeScreen({ navigation }) {
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.stagger(200, [
      Animated.timing(titleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(subtitleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Floating skull
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Background grid lines */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* Floating skull icon */}
      <Animated.Text
        style={[styles.skullIcon, { transform: [{ translateY: floatAnim }] }]}
      >
        💀
      </Animated.Text>

      {/* Title */}
      <Animated.View
        style={{
          opacity: titleAnim,
          transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
        }}
      >
        <Animated.Text style={[styles.title, { opacity: glowOpacity }]}>
          MICRO
        </Animated.Text>
        <Text style={styles.titleAccent}>RPG</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleAnim,
            transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          },
        ]}
      >
        Descend into the dungeon.{'\n'}Few return.
      </Animated.Text>

      {/* Divider */}
      <View style={styles.divider} />

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
          <Text style={styles.primaryBtnText}>⚔  BEGIN QUEST</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('HallOfFame')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>🏆  HALL OF FAME</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>v1.0  ·  POWERED BY CLAUDE AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  skullIcon: {
    fontSize: 52,
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontFamily: FONTS.pixel,
    fontSize: 28,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 6,
    textShadowColor: COLORS.primaryDark,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleAccent: {
    fontFamily: FONTS.pixel,
    fontSize: 36,
    color: COLORS.gold,
    textAlign: 'center',
    letterSpacing: 10,
    marginTop: 4,
    textShadowColor: COLORS.goldDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontFamily: FONTS.pixel,
    fontSize: 7,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    letterSpacing: 1,
  },
  divider: {
    width: 120,
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 32,
  },
  buttonGroup: {
    width: '100%',
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryDark,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    color: COLORS.white,
    letterSpacing: 2,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 2,
  },
  secondaryBtnText: {
    fontFamily: FONTS.pixel,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    fontFamily: FONTS.pixel,
    fontSize: 5,
    color: COLORS.textDim,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
