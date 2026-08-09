// English word-building content for Stage L3 (word building / blending).
// Language-keyed by design, same as constants/letters.en.ts: a future
// wordBuilding.pt.ts can plug into useWordBuilding with its own word list
// and picture cues, no engine change required.
//
// Only words with a verified-good `_blend.wav` recording are listed here.
// scripts/process-voice-recordings.mjs flagged tap_blend.wav (suspiciously
// short — likely a fragment) and cat_blend.wav (suspiciously long — likely
// contains leftover audio from a neighboring word) as low-confidence. Both
// files exist and usePhonics.ts already wires them up, so once a re-listen
// (or re-recording) confirms they're clean, add them below in the same
// shape and they'll show up here with no other changes.

import { LetterId } from './letters.en';

export type WordBuildEntry = {
  word: string;
  letters: LetterId[];
  pictureCue: { emoji: string };
};

export type WordBuildingContent = {
  languageCode: 'en';
  words: WordBuildEntry[];
};

const WORDS: WordBuildEntry[] = [
  { word: 'sat', letters: ['s', 'a', 't'], pictureCue: { emoji: '🪑' } },
  { word: 'pin', letters: ['p', 'i', 'n'], pictureCue: { emoji: '📌' } },
  { word: 'nap', letters: ['n', 'a', 'p'], pictureCue: { emoji: '😴' } },
  { word: 'dog', letters: ['d', 'o', 'g'], pictureCue: { emoji: '🐶' } },
  // { word: 'tap', letters: ['t', 'a', 'p'], pictureCue: { emoji: '🚰' } },
  // { word: 'cat', letters: ['c', 'a', 't'], pictureCue: { emoji: '🐱' } },
];

export const WORD_BUILDING_EN: WordBuildingContent = {
  languageCode: 'en',
  words: WORDS,
};

export default WORD_BUILDING_EN;
