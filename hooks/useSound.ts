import { useEffect } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

const POP_SOURCE = require('../assets/audio/pop.wav');
const CHIME_SOURCE = require('../assets/audio/chime.wav');

// A calm, consistent voice for every spoken line in the app.
const VOICE_OPTIONS: Speech.SpeechOptions = { pitch: 1.05, rate: 0.9 };

export default function useSound() {
  const pop = useAudioPlayer(POP_SOURCE);
  const chime = useAudioPlayer(CHIME_SOURCE);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  async function playPop() {
    try {
      // seekTo is async on native (bridge call) — await it before play() so a
      // rapid re-tap doesn't start playback mid-seek and skip the pop.
      await pop.seekTo(0);
      pop.play();
    } catch {
      // audio is a nice-to-have; never block the interaction on it
    }
  }

  async function playChime() {
    try {
      await chime.seekTo(0);
      chime.play();
    } catch {
      // ignore
    }
  }

  function speak(text: string) {
    try {
      Speech.speak(text, VOICE_OPTIONS);
    } catch {
      // ignore
    }
  }

  function playNumber(n?: number | null) {
    if (n == null) return;
    playPop();
    speak(String(n));
  }

  function playTotal(n: number, noun: string) {
    playChime();
    speak(`${n} ${noun}!`);
  }

  function triggerHaptic() {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // ignore
    }
  }

  return {
    playNumber,
    playTotal,
    speak,
    triggerHaptic,
  } as const;
}
