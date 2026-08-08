import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import useLetters from './useLetters';
import usePhonics from './usePhonics';
import { LetterId } from '../constants/letters.en';

// Stage A (LETTERS-VERTICAL-BRIEF.md §2): pure exposure + sound association —
// no quiz, no right/wrong, no score. New letters are introduced one at a
// time in curriculum order; before a new letter is shown, every
// already-learned letter is revisited first (a simple rotation, per the
// brief — "simple rotation is fine").

// The rotation for one sitting: every already-learned letter (in curriculum
// order), then the next not-yet-learned one (if any) at the end.
export function buildQueue(availableForMatching: LetterId[], currentLetterId: LetterId | null): LetterId[] {
  return currentLetterId ? [...availableForMatching, currentLetterId] : availableForMatching;
}

// True when the rotation is sitting on the one slot that hasn't been
// learned yet — the moment "Next" should graduate it into the rotation
// (mark it learned) rather than just moving the cursor forward.
export function isAtNewLetterSlot(queue: LetterId[], displayIndex: number, currentLetterId: LetterId | null): boolean {
  return currentLetterId != null && displayIndex === queue.length - 1 && queue[displayIndex] === currentLetterId;
}

export default function useLetterIntroduction() {
  const { content, currentLetterId, availableForMatching, markLearned } = useLetters();
  const { playSound } = usePhonics();
  const [displayIndex, setDisplayIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const queue = buildQueue(availableForMatching, currentLetterId);
  // Guard against a stale index the same render a shrinking queue would
  // otherwise index out of bounds on (the effect below corrects it after,
  // but this keeps the render itself safe in the meantime).
  const safeIndex = displayIndex < queue.length ? displayIndex : 0;
  const displayedLetterId: LetterId | null = queue[safeIndex] ?? null;

  useEffect(() => {
    if (displayIndex >= queue.length && queue.length > 0) setDisplayIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  useEffect(() => {
    // A newly-displayed letter starts with its picture cue hidden again —
    // tapping is what reveals it (brief L1 scope).
    setRevealed(false);
  }, [displayedLetterId]);

  function handleLetterPress() {
    if (!displayedLetterId) return;
    playSound(displayedLetterId);
    setRevealed(true);
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // ignore — haptics is a nice-to-have, never blocks the interaction
    }
  }

  function handleNext() {
    if (queue.length === 0) return;
    if (isAtNewLetterSlot(queue, safeIndex, currentLetterId)) {
      markLearned(currentLetterId as LetterId);
      setDisplayIndex(0);
    } else {
      setDisplayIndex(i => (i + 1) % queue.length);
    }
  }

  return {
    letter: displayedLetterId ? content.letters[displayedLetterId] : null,
    displayedLetterId,
    revealed,
    handleLetterPress,
    handleNext,
  } as const;
}
