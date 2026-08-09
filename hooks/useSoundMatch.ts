import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import useLetters from './useLetters';
import usePhonics from './usePhonics';
import { LetterId } from '../constants/letters.en';

// A generic celebration chime, not phonics content — reusing the same clip
// Counting's useSound.ts uses for its own round-complete moment, rather than
// adding a second copy of the same kind of asset.
const CHIME_SOURCE = require('../assets/audio/chime.wav');

// Stage B (LETTERS-VERTICAL-BRIEF.md §2 Stage B, §4): the app plays a target
// sound, 2-3 already-learned letters are shown, the child taps one. Correct
// taps get a warm celebration; a non-target tap is treated as exploration —
// NO fail sound, NO score — the tapped letter just says its own sound, then
// the app re-invites toward the target. Always ends on success.

const MAX_OPTIONS = 3;
const MIN_LEARNED_TO_PLAY = 2;

export type SoundMatchRound = {
  targetId: LetterId;
  optionIds: LetterId[];
};

export type SoundMatchPhase = 'idle' | 'correct' | 'exploring';

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Picks a target + 2-3 options (only from already-learned letters, per the
// brief) — pure and injectable-random so it's deterministic under test.
// null when there aren't enough learned letters yet for a meaningful round.
export function pickRound(
  learnedIds: LetterId[],
  previousTargetId: LetterId | null,
  random: () => number = Math.random
): SoundMatchRound | null {
  if (learnedIds.length < MIN_LEARNED_TO_PLAY) return null;

  // Avoid immediately repeating the same target twice in a row when there's
  // another letter available to pick instead.
  const targetPool =
    previousTargetId != null && learnedIds.length > 1 ? learnedIds.filter(id => id !== previousTargetId) : learnedIds;
  const targetId = targetPool[Math.floor(random() * targetPool.length)];

  const distractorSlots = Math.min(MAX_OPTIONS, learnedIds.length) - 1;
  const distractors = shuffle(
    learnedIds.filter(id => id !== targetId),
    random
  ).slice(0, distractorSlots);

  return { targetId, optionIds: shuffle([targetId, ...distractors], random) };
}

// A previous round's options are still valid to keep showing as long as
// every one of them is still in the learned pool (learning a *new* letter
// mid-round shouldn't yank the options out from under an in-progress tap).
function roundStillValid(round: SoundMatchRound | null, learnedIds: LetterId[]): round is SoundMatchRound {
  return round != null && round.optionIds.every(id => learnedIds.includes(id));
}

const CELEBRATE_MS = 1300;
const EXPLORE_PAUSE_MS = 600;
const REINVITE_DELAY_MS = 450;

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export default function useSoundMatch() {
  const { content, availableForMatching } = useLetters();
  const { playSound } = usePhonics();
  const chime = useAudioPlayer(CHIME_SOURCE);
  const previousTargetRef = useRef<LetterId | null>(null);
  const [round, setRound] = useState<SoundMatchRound | null>(null);
  const [phase, setPhase] = useState<SoundMatchPhase>('idle');
  const [tappedId, setTappedId] = useState<LetterId | null>(null);

  async function playChime() {
    try {
      await chime.seekTo(0);
      chime.play();
    } catch {
      // ignore — audio is a nice-to-have, never blocks the interaction
    }
  }

  // (Re)pick a round whenever the current one is no longer valid — covers
  // both the initial load (learnedIds starts empty until AsyncStorage
  // resolves) and a newly-learned letter growing the pool.
  useEffect(() => {
    setRound(prev => (roundStillValid(prev, availableForMatching) ? prev : pickRound(availableForMatching, previousTargetRef.current)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableForMatching.length]);

  function playTarget() {
    if (round) playSound(round.targetId);
  }

  async function handleOptionPress(id: LetterId) {
    if (!round || phase !== 'idle') return;
    const correct = id === round.targetId;

    setTappedId(id);
    setPhase(correct ? 'correct' : 'exploring');
    // The chime is a celebratory layer on top of the phoneme, not a
    // replacement for it — fire it alongside rather than awaiting it, so it
    // doesn't delay the sound that's actually teaching something.
    if (correct) playChime();
    await playSound(id);
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // ignore — haptics is a nice-to-have, never blocks the interaction
    }

    if (correct) {
      await wait(CELEBRATE_MS);
      previousTargetRef.current = round.targetId;
      setPhase('idle');
      setTappedId(null);
      setRound(pickRound(availableForMatching, round.targetId));
    } else {
      await wait(EXPLORE_PAUSE_MS);
      setPhase('idle');
      setTappedId(null);
      await wait(REINVITE_DELAY_MS);
      playSound(round.targetId); // re-invite toward the target — same round, same options
    }
  }

  return {
    letters: content.letters,
    round,
    phase,
    tappedId,
    playTarget,
    handleOptionPress,
  } as const;
}
