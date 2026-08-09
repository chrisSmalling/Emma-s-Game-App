import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import usePhonics from './usePhonics';
import LETTERS_EN, { LetterId } from '../constants/letters.en';
import WORD_BUILDING_EN, { WordBuildingContent } from '../constants/wordBuilding.en';

// Stage L3 (word building / blending): a picture + empty slots show the
// goal, the word's own letters appear scrambled as tappable tiles, and the
// child fills the slots in order. No distractors, no fail state — a tap on
// a not-yet-expected letter just plays that letter's own sound in place and
// waits; only the correct next letter ever advances the round. Completing
// the word plays the recorded blend clip, then a calm celebration, then
// moves on to the next word.

export type TapPhase = 'idle' | 'correct' | 'exploring';
export type RoundPhase = 'building' | 'celebrating';

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Pure and injectable-random so it's deterministic under test.
export function scrambleLetters(letters: LetterId[], random: () => number = Math.random): LetterId[] {
  return shuffle(letters, random);
}

const TILE_SETTLE_MS = 500;
const EXPLORE_MS = 600;
const BEAT_BEFORE_BLEND_MS = 300;
const CELEBRATE_MS = 2200;

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export default function useWordBuilding(content: WordBuildingContent = WORD_BUILDING_EN, random: () => number = Math.random) {
  const { playSound, playWord, playBlend } = usePhonics();
  const words = content.words;

  const [wordIndex, setWordIndex] = useState(0);
  const [scrambled, setScrambled] = useState<LetterId[]>(() => scrambleLetters(words[0]?.letters ?? [], random));
  const [placedCount, setPlacedCount] = useState(0);
  const [placedTileIndices, setPlacedTileIndices] = useState<number[]>([]);
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [tapPhase, setTapPhase] = useState<TapPhase>('idle');
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('building');

  const word = words[wordIndex] ?? null;

  function startWord(index: number) {
    setWordIndex(index);
    setScrambled(scrambleLetters(words[index].letters, random));
    setPlacedCount(0);
    setPlacedTileIndices([]);
    setActiveTileIndex(null);
    setTapPhase('idle');
    setRoundPhase('building');
  }

  function playPrompt() {
    if (word) playWord(word.word);
  }

  async function handleTilePress(tileIndex: number) {
    if (!word || roundPhase !== 'building' || tapPhase !== 'idle') return;
    const letterId = scrambled[tileIndex];
    const isCorrect = letterId === word.letters[placedCount] && !placedTileIndices.includes(tileIndex);

    setActiveTileIndex(tileIndex);
    setTapPhase(isCorrect ? 'correct' : 'exploring');
    await playSound(letterId);
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // ignore — haptics is a nice-to-have, never blocks the interaction
    }

    if (isCorrect) {
      await wait(TILE_SETTLE_MS);
      const newPlacedCount = placedCount + 1;
      setPlacedTileIndices(prev => [...prev, tileIndex]);
      setPlacedCount(newPlacedCount);
      setTapPhase('idle');
      setActiveTileIndex(null);

      if (newPlacedCount === word.letters.length) {
        setRoundPhase('celebrating');
        await wait(BEAT_BEFORE_BLEND_MS);
        await playBlend(word.letters, word.word);
        await wait(CELEBRATE_MS);
        startWord((wordIndex + 1) % words.length);
      }
    } else {
      await wait(EXPLORE_MS);
      setTapPhase('idle');
      setActiveTileIndex(null);
    }
  }

  return {
    letters: LETTERS_EN.letters,
    word,
    scrambled,
    placedCount,
    placedTileIndices,
    activeTileIndex,
    tapPhase,
    roundPhase,
    playPrompt,
    handleTilePress,
  } as const;
}
