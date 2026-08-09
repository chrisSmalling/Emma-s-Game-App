import { useEffect, useRef } from 'react';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// TODO(Seam A — constants/profile.ts): profile.activeVoiceId isn't read
// here yet. Today there's only ever one recorded voice, so there's nothing
// to select between; wiring it in is not trivial — Metro requires every
// require() path below to be a static literal, so a real multi-voice
// structure needs a voice-keyed asset layout (e.g.
// assets/audio/phonics/en/<voiceId>/sounds/<id>.wav) before this can route
// on activeVoiceId. Left undone deliberately rather than restructuring
// audio as a side effect of this seam.

// Generated locally by scripts/generate-phonics-audio.mjs (eSpeak NG, run
// once at build/dev time — never at runtime, never imported by app code).
// See assets/audio/phonics/README.md for the phoneme choice behind each
// letter and the known trouble spots (stop-consonant schwa, short-vowel
// quality, /r/'s isolation limits). Each letter has its own file so
// regenerating one — or eventually swapping in a real recording — never
// touches this hook. Metro requires each require() path to be a static
// literal, which is why every key is spelled out below rather than built
// from a template. If a future letter/word is added to
// constants/letters.en.ts before its audio is generated, point its
// require() at _placeholder.wav until `generate-phonics-audio.mjs` covers it.
const LETTER_SOURCES: Record<string, ReturnType<typeof require>> = {
  s: require('../assets/audio/phonics/en/sounds/s.wav'),
  a: require('../assets/audio/phonics/en/sounds/a.wav'),
  t: require('../assets/audio/phonics/en/sounds/t.wav'),
  p: require('../assets/audio/phonics/en/sounds/p.wav'),
  i: require('../assets/audio/phonics/en/sounds/i.wav'),
  n: require('../assets/audio/phonics/en/sounds/n.wav'),
  m: require('../assets/audio/phonics/en/sounds/m.wav'),
  d: require('../assets/audio/phonics/en/sounds/d.wav'),
  g: require('../assets/audio/phonics/en/sounds/g.wav'),
  o: require('../assets/audio/phonics/en/sounds/o.wav'),
  c: require('../assets/audio/phonics/en/sounds/c.wav'),
  k: require('../assets/audio/phonics/en/sounds/k.wav'),
  ck: require('../assets/audio/phonics/en/sounds/ck.wav'),
  e: require('../assets/audio/phonics/en/sounds/e.wav'),
  u: require('../assets/audio/phonics/en/sounds/u.wav'),
  r: require('../assets/audio/phonics/en/sounds/r.wav'),
  h: require('../assets/audio/phonics/en/sounds/h.wav'),
  b: require('../assets/audio/phonics/en/sounds/b.wav'),
  f: require('../assets/audio/phonics/en/sounds/f.wav'),
  l: require('../assets/audio/phonics/en/sounds/l.wav'),
};

// Same generation pipeline, plain-text input (natural word blending, not
// isolated phonemes) — the Stage C "…sat!" payoff.
const WORD_SOURCES: Record<string, ReturnType<typeof require>> = {
  at: require('../assets/audio/phonics/en/words/at.wav'),
  sat: require('../assets/audio/phonics/en/words/sat.wav'),
  pat: require('../assets/audio/phonics/en/words/pat.wav'),
  tap: require('../assets/audio/phonics/en/words/tap.wav'),
  tip: require('../assets/audio/phonics/en/words/tip.wav'),
  pin: require('../assets/audio/phonics/en/words/pin.wav'),
  pan: require('../assets/audio/phonics/en/words/pan.wav'),
  nap: require('../assets/audio/phonics/en/words/nap.wav'),
  sip: require('../assets/audio/phonics/en/words/sip.wav'),
  mad: require('../assets/audio/phonics/en/words/mad.wav'),
  dog: require('../assets/audio/phonics/en/words/dog.wav'),
  cat: require('../assets/audio/phonics/en/words/cat.wav'),
  cot: require('../assets/audio/phonics/en/words/cot.wav'),
  kid: require('../assets/audio/phonics/en/words/kid.wav'),
  mop: require('../assets/audio/phonics/en/words/mop.wav'),
};

// Real recordings of the full "sss... a... t... sat!" cadence (see
// scripts/process-voice-recordings.mjs) — preferred over the synthesized
// fallback below whenever a word has one. tap_blend and cat_blend are
// wired up here (the files exist) but scripts/process-voice-recordings.mjs
// flagged both as low-confidence splits; constants/wordBuilding.en.ts
// leaves them out of Stage C's word list until that's resolved, but any
// other caller of playBlend for those two words gets the recording as-is.
const BLEND_SOURCES: Record<string, ReturnType<typeof require>> = {
  sat: require('../assets/audio/phonics/en/words/sat_blend.wav'),
  pin: require('../assets/audio/phonics/en/words/pin_blend.wav'),
  tap: require('../assets/audio/phonics/en/words/tap_blend.wav'),
  nap: require('../assets/audio/phonics/en/words/nap_blend.wav'),
  dog: require('../assets/audio/phonics/en/words/dog_blend.wav'),
  cat: require('../assets/audio/phonics/en/words/cat_blend.wav'),
};

// Pacing for the synthesized blend fallback (brief §2 Stage C) — a word
// with no BLEND_SOURCES entry falls back to sounding out each letter with a
// pause, then the whole word. Placeholder timings.
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
  const blendPlayers = useRef<Record<string, AudioPlayer>>({});

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
    for (const [word, source] of Object.entries(BLEND_SOURCES)) {
      try {
        blendPlayers.current[word] = createAudioPlayer(source);
      } catch {
        // ignore
      }
    }

    return () => {
      [
        ...Object.values(letterPlayers.current),
        ...Object.values(wordPlayers.current),
        ...Object.values(blendPlayers.current),
      ].forEach(player => {
        try {
          player.remove();
        } catch {
          // ignore
        }
      });
      letterPlayers.current = {};
      wordPlayers.current = {};
      blendPlayers.current = {};
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

  function playSound(letterId: string) {
    return playFrom(letterPlayers, letterId);
  }

  function playWord(word: string) {
    return playFrom(wordPlayers, word);
  }

  // The core Stage C moment (brief §2 Stage C): "/sss/-/a/-/t/… sat!" —
  // the real recording when this word has one (see BLEND_SOURCES above),
  // otherwise synthesized from the individual letter sounds + whole word.
  async function playBlend(letterIds: string[], word: string) {
    if (blendPlayers.current[word]) {
      return playFrom(blendPlayers, word);
    }
    for (const id of letterIds) {
      await playSound(id);
      await wait(BLEND_LETTER_PAUSE_MS);
    }
    await wait(BLEND_TO_WORD_PAUSE_MS);
    await playWord(word);
  }

  return {
    playSound,
    playWord,
    playBlend,
  } as const;
}
