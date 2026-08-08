import { useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

const POP_SOURCE = require('../assets/audio/pop.wav');
const CHIME_SOURCE = require('../assets/audio/chime.wav');

// Placeholder TTS tuning for a warmer, child-friendly delivery: a touch
// slower than natural speech, pitch left close to natural (1.0) so it stays
// warm rather than turning "chipmunky". These are stand-in values — swap
// for real recorded voice clips (e.g. a parent's own voice) when available;
// see hooks/README.md.
const VOICE_OPTIONS: Speech.SpeechOptions = { pitch: 1.02, rate: 0.85 };

export default function useSound() {
  const pop = useAudioPlayer(POP_SOURCE);
  const chime = useAudioPlayer(CHIME_SOURCE);
  const preferredVoiceId = useRef<string | undefined>(undefined);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    // Prefer a higher-quality en-US voice when the platform offers one (e.g.
    // iOS ships "Enhanced"/"Premium" quality voices alongside the default
    // compact ones). Entirely on-device — expo-speech never hits the
    // network — falls back to the system default voice if none qualify.
    Speech.getAvailableVoicesAsync()
      .then(voices => {
        const enUS = voices.filter(v => v.language?.toLowerCase().startsWith('en-us'));
        const enhanced = enUS.find(v => v.quality === Speech.VoiceQuality.Enhanced);
        preferredVoiceId.current = (enhanced ?? enUS[0])?.identifier;
      })
      .catch(() => {
        // no voice list available on this platform — system default is used
      });
  }, []);

  async function playPop() {
    try {
      // Slight pitch/speed variation per tap so consecutive taps don't sound
      // identical — a small bit of sonic novelty to help hold attention.
      // shouldCorrectPitch=false lets playbackRate actually shift the pitch
      // instead of just the speed.
      pop.shouldCorrectPitch = false;
      pop.playbackRate = 0.9 + Math.random() * 0.3; // 0.9x–1.2x
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
      Speech.speak(text, { ...VOICE_OPTIONS, voice: preferredVoiceId.current });
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
