import { useEffect, useRef } from 'react';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// TODO(real audio): every key below currently points at the same non-speech
// placeholder blip tone — see assets/audio/phonics/README.md for why (not
// TTS, not synthesized — real recordings are required) and what to record.
// Swapping in a real clip is a one-line change per key; nothing else in this
// hook needs to change.
const PLACEHOLDER = require('../assets/audio/phonics/en/_placeholder.wav');

// Keys match constants/letters.en.ts LetterEntry.id / WordEntry.word exactly.
const LETTER_SOURCES: Record<string, ReturnType<typeof require>> = {
  s: PLACEHOLDER,
  a: PLACEHOLDER,
  t: PLACEHOLDER,
  p: PLACEHOLDER,
  i: PLACEHOLDER,
  n: PLACEHOLDER,
  m: PLACEHOLDER,
  d: PLACEHOLDER,
  g: PLACEHOLDER,
  o: PLACEHOLDER,
  c: PLACEHOLDER,
  k: PLACEHOLDER,
  ck: PLACEHOLDER,
  e: PLACEHOLDER,
  u: PLACEHOLDER,
  r: PLACEHOLDER,
  h: PLACEHOLDER,
  b: PLACEHOLDER,
  f: PLACEHOLDER,
  l: PLACEHOLDER,
};

const WORD_SOURCES: Record<string, ReturnType<typeof require>> = {
  at: PLACEHOLDER,
  sat: PLACEHOLDER,
  pat: PLACEHOLDER,
  tap: PLACEHOLDER,
  tip: PLACEHOLDER,
  pin: PLACEHOLDER,
  pan: PLACEHOLDER,
  nap: PLACEHOLDER,
  sip: PLACEHOLDER,
  mad: PLACEHOLDER,
  dog: PLACEHOLDER,
  cat: PLACEHOLDER,
  cot: PLACEHOLDER,
  kid: PLACEHOLDER,
  mop: PLACEHOLDER,
};

// Pacing for the Stage C "slow blend" (brief §2 Stage C): a pause between
// each letter's sound, then a beat before the whole word — placeholder
// timings, worth re-tuning once real recordings set the actual rhythm.
const BLEND_LETTER_PAUSE_MS = 550;
const BLEND_TO_WORD_PAUSE_MS = 350;

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

// Wraps expo-audio for the phonics vertical: pure phoneme/word playback,
// never TTS (see assets/audio/phonics/README.md — TTS mispronounces
// isolated sounds). One AudioPlayer per letter/word, pre-created on mount
// (same reliable pattern as hooks/useSound.ts's pop/chime) so playback on
// tap doesn't race a cold load.
export default function usePhonics() {
  const letterPlayers = useRef<Record<string, AudioPlayer>>({});
  const wordPlayers = useRef<Record<string, AudioPlayer>>({});

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

    for (const [id, source] of Object.entries(LETTER_SOURCES)) {
      try {
        letterPlayers.current[id] = createAudioPlayer(source);
      } catch {
        // audio is a nice-to-have; never block the interaction on it
      }
    }
    for (const [word, source] of Object.entries(WORD_SOURCES)) {
      try {
        wordPlayers.current[word] = createAudioPlayer(source);
      } catch {
        // ignore
      }
    }

    return () => {
      [...Object.values(letterPlayers.current), ...Object.values(wordPlayers.current)].forEach(player => {
        try {
          player.remove();
        } catch {
          // ignore
        }
      });
      letterPlayers.current = {};
      wordPlayers.current = {};
    };
  }, []);

  async function playFrom(playersRef: { current: Record<string, AudioPlayer> }, key: string) {
    const player = playersRef.current[key];
    if (!player) return;
    try {
      // seekTo is async on native (bridge call) — await it before play() so
      // a rapid re-tap doesn't start playback mid-seek and skip the sound.
      await player.seekTo(0);
      player.play();
    } catch {
      // ignore
    }
  }

  function playLetterSound(letterId: string) {
    return playFrom(letterPlayers, letterId);
  }

  function playWord(word: string) {
    return playFrom(wordPlayers, word);
  }

  // The core Stage C moment (brief §2 Stage C): each letter's sound in
  // order, then the whole word — "/sss/-/a/-/t/… sat!"
  async function playBlend(letterIds: string[], word: string) {
    for (const id of letterIds) {
      await playLetterSound(id);
      await wait(BLEND_LETTER_PAUSE_MS);
    }
    await wait(BLEND_TO_WORD_PAUSE_MS);
    await playWord(word);
  }

  return {
    playLetterSound,
    playWord,
    playBlend,
  } as const;
}
