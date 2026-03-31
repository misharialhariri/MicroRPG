import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function Typewriter({ text, speed = 28, style, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;

    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(timerRef.current);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text]);

  return <Text style={[styles.text, style]}>{displayed}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: Typography.bodyMedium * Typography.lineHeightBody,
  },
});
