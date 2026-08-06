import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

// Map names to bundled assets. Keep in sync with assets/audio/
const AUDIO_MAP: Record<string, any> = {
  '1': require('../assets/audio/1.mp3'),
  '2': require('../assets/audio/2.mp3'),
  '3': require('../assets/audio/3.mp3'),
  '4': require('../assets/audio/4.mp3'),
  '5': require('../assets/audio/5.mp3'),
  total: require('../assets/audio/total.mp3'),
  prompt: require('../assets/audio/prompt.mp3'),
  confetti: require('../assets/audio/confetti.mp3'),
};

export default function useSound() {
  const loadedSounds = useRef<Record<string, Audio.Sound | null>>({});

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      } catch (e) {
        // ignore
      }

      const keys = Object.keys(AUDIO_MAP);
      for (const k of keys) {
        try {
          const module = AUDIO_MAP[k];
          if (!module) continue;
          const { sound } = await Audio.Sound.createAsync(module, { shouldPlay: false });
          if (!mounted) break;
          loadedSounds.current[k] = sound;
        } catch (e) {
          console.warn('Failed to preload audio', k, e);
          loadedSounds.current[k] = null;
        }
      }
    })();

    return () => {
      mounted = false;
      const keys = Object.keys(loadedSounds.current);
      keys.forEach(async k => {
        const s = loadedSounds.current[k];
        if (s) {
          try {
            await s.unloadAsync();
          } catch (e) {}
        }
      });
    };
  }, []);

  async function playBundledClip(name: string): Promise<boolean> {
    try {
      const sound = loadedSounds.current[name];
      if (!sound) return false;
      try {
        await sound.replayAsync();
        return true;
      } catch (e) {
        try {
          await sound.playAsync();
          return true;
        } catch (e2) {
          console.warn('Playback error for', name, e2);
          return false;
        }
      }
    } catch (e) {
      console.warn('Bundled audio playback failed for', name, e);
      return false;
    }
  }

  async function playNumber(n?: number | null) {
    if (n == null) return;
    const name = String(n);
    const played = await playBundledClip(name);
    if (!played) {
      Speech.speak(String(n), { pitch: 1.05, rate: 0.95 });
    }
  }

  async function playSfx(name: string) {
    await playBundledClip(name);
  }

  function speak(text: string) {
    Speech.speak(text);
  }

  function triggerHaptic() {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
  }

  return {
    playNumber,
    playSfx,
    speak,
    triggerHaptic,
  } as const;
}
