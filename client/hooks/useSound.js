import { useCallback, useRef } from 'react';
import { Audio } from 'expo-av';

const SOUND_MAP = {
  hit: require('../assets/sounds/hit.mp3'),
  death: require('../assets/sounds/death.mp3'),
  victory: require('../assets/sounds/victory.mp3'),
  treasure: require('../assets/sounds/treasure.mp3'),
  levelup: require('../assets/sounds/levelup.mp3'),
};

export function useSound() {
  const soundRefs = useRef({});

  const play = useCallback(async (name) => {
    if (!SOUND_MAP[name]) return;
    try {
      // Unload previous instance of same sound
      if (soundRefs.current[name]) {
        await soundRefs.current[name].unloadAsync().catch(() => {});
      }
      const { sound } = await Audio.Sound.createAsync(SOUND_MAP[name]);
      soundRefs.current[name] = sound;
      await sound.playAsync();
    } catch {
      // Sound files missing or device muted — fail silently
    }
  }, []);

  const stop = useCallback(async (name) => {
    try {
      await soundRefs.current[name]?.stopAsync();
    } catch {}
  }, []);

  return { play, stop };
}
