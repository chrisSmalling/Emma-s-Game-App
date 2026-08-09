import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LETTERS_EN, { LetterId, LettersContent } from '../constants/letters.en';
import { getProfile, LanguageCode } from '../constants/profile';

const STORAGE_KEY_LEARNED = 'littleLearner.letters.en.learnedLetterIds';

// Letters content keyed by profile.activeLanguage (constants/profile.ts —
// Seam A). Only 'en' exists today; a future letters.pt.ts adds a 'pt' entry
// here and nothing else in this file changes.
const CONTENT_BY_LANGUAGE: Partial<Record<LanguageCode, LettersContent>> = {
  en: LETTERS_EN,
};

// Falls back to English if the active language has no content yet, so the
// app stays usable while other languages are still being built out.
export function contentForLanguage(languageCode: LanguageCode): LettersContent {
  return CONTENT_BY_LANGUAGE[languageCode] ?? LETTERS_EN;
}

// The engine is language-agnostic (brief §7): every function here takes the
// LettersContent as data and never assumes English or SATPIN specifically —
// the order lives entirely in content.sets.

// Every letter across every set, in curriculum order.
export function flattenSequence(content: LettersContent): LetterId[] {
  return content.sets.flatMap(set => set.letterIds);
}

export function setIdForLetter(content: LettersContent, letterId: LetterId): string | undefined {
  return content.sets.find(set => set.letterIds.includes(letterId))?.id;
}

// The next letter to introduce: the first one in sequence order not already
// learned. null once every letter in the content has been learned.
export function nextLetterToIntroduce(content: LettersContent, learned: LetterId[]): LetterId | null {
  return flattenSequence(content).find(id => !learned.includes(id)) ?? null;
}

// Letters available for Stage B sound-matching — only ones already learned
// (brief §2 Stage B), in sequence order.
export function learnedLetters(content: LettersContent, learned: LetterId[]): LetterId[] {
  return flattenSequence(content).filter(id => learned.includes(id));
}

// Words playable in Stage C: every letter the word needs must be learned.
export function playableWords(content: LettersContent, learned: LetterId[]) {
  return content.words.filter(w => w.letters.every(id => learned.includes(id)));
}

// Pure progression state for the Letters vertical: which letters have been
// introduced, and (derived from that) what's next. Mirrors useCounting.ts's
// shape — plain state + AsyncStorage persistence, no side effects inside a
// setState updater (the read-then-decide happens in the callback body,
// against the closed-over current state, same pattern as useCounting's
// tapItem/persistHighest).
export default function useLetters(content: LettersContent = contentForLanguage(getProfile().activeLanguage)) {
  const [learnedIds, setLearnedIds] = useState<LetterId[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_LEARNED)
      .then(value => {
        if (!value) return;
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setLearnedIds(parsed.filter((id): id is string => typeof id === 'string'));
        }
      })
      .catch(() => {
        // no persisted progress yet, or storage unavailable — start fresh
      });
  }, []);

  const markLearned = useCallback(
    (letterId: LetterId) => {
      if (learnedIds.includes(letterId)) return;
      const next = [...learnedIds, letterId];
      setLearnedIds(next);
      AsyncStorage.setItem(STORAGE_KEY_LEARNED, JSON.stringify(next)).catch(() => {});
    },
    [learnedIds]
  );

  const resetProgress = useCallback(() => {
    setLearnedIds([]);
    AsyncStorage.removeItem(STORAGE_KEY_LEARNED).catch(() => {});
  }, []);

  const currentLetterId = nextLetterToIntroduce(content, learnedIds);

  return {
    content,
    learnedIds,
    currentLetterId,
    currentSetId: currentLetterId ? setIdForLetter(content, currentLetterId) : undefined,
    availableForMatching: learnedLetters(content, learnedIds),
    availableWords: playableWords(content, learnedIds),
    markLearned,
    resetProgress,
  } as const;
}
