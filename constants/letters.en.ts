// English curriculum data for the Letters (phonics) vertical.
// See LETTERS-VERTICAL-BRIEF.md for the full pedagogy this implements.
//
// Language-keyed by design (brief §7): this file is the *data*. The engine
// (hooks/useLetters.ts, hooks/usePhonics.ts) must never assume English —
// SATPIN order, phoneme content, and word lists all live here so a future
// letters.pt.ts can plug into the same engine with its own sequence.

export type LetterId = string; // 's' | 'a' | ... | 'ck' (digraphs are 2 chars)

export type LetterEntry = {
  // Also doubles as the sound-file key: hooks/usePhonics.ts's playSound(id)
  // plays assets/audio/phonics/en/sounds/<id>.mp3.
  id: LetterId;
  // Lowercase display glyph — early phonics programs (this curriculum is
  // modeled on synthetic phonics / SATPIN, e.g. Jolly Phonics) teach the
  // lowercase form first, since that's the print children actually read.
  display: string;
  // Continuant sounds (can be held: /sss/, /mmm/) vs. stop/plosive sounds
  // (can't be held: /t/, /p/) — continuants are easier to blend and SATPIN
  // front-loads them (brief §1). Not yet used by any stage's logic, but is
  // real phonics classification worth having modeled from day one.
  continuous: boolean;
  pictureCue: { word: string; emoji: string };
};

export type WordEntry = {
  word: string;
  letters: LetterId[];
  setId: string; // which set unlocks this word, for future progression gating
};

export type LetterSet = {
  id: string;
  label: string;
  letterIds: LetterId[];
};

export type LettersContent = {
  languageCode: 'en';
  sets: LetterSet[];
  letters: Record<LetterId, LetterEntry>;
  words: WordEntry[];
};

const LETTER_ENTRIES: LetterEntry[] = [
  // Set 1 — s, a, t, p, i, n
  { id: 's', display: 's', continuous: true, pictureCue: { word: 'snake', emoji: '🐍' } },
  { id: 'a', display: 'a', continuous: true, pictureCue: { word: 'apple', emoji: '🍎' } },
  { id: 't', display: 't', continuous: false, pictureCue: { word: 'turtle', emoji: '🐢' } },
  { id: 'p', display: 'p', continuous: false, pictureCue: { word: 'pig', emoji: '🐷' } },
  { id: 'i', display: 'i', continuous: true, pictureCue: { word: 'igloo', emoji: '🧊' } },
  { id: 'n', display: 'n', continuous: true, pictureCue: { word: 'nest', emoji: '🪺' } },
  // Set 2 — m, d, g, o, c, k
  { id: 'm', display: 'm', continuous: true, pictureCue: { word: 'monkey', emoji: '🐒' } },
  { id: 'd', display: 'd', continuous: false, pictureCue: { word: 'dog', emoji: '🐶' } },
  { id: 'g', display: 'g', continuous: false, pictureCue: { word: 'goat', emoji: '🐐' } },
  { id: 'o', display: 'o', continuous: true, pictureCue: { word: 'octopus', emoji: '🐙' } },
  { id: 'c', display: 'c', continuous: false, pictureCue: { word: 'cat', emoji: '🐱' } },
  { id: 'k', display: 'k', continuous: false, pictureCue: { word: 'kite', emoji: '🪁' } },
  // Set 3+ — widening bank (not yet introduced by any built stage)
  { id: 'ck', display: 'ck', continuous: false, pictureCue: { word: 'duck', emoji: '🦆' } },
  { id: 'e', display: 'e', continuous: true, pictureCue: { word: 'elephant', emoji: '🐘' } },
  { id: 'u', display: 'u', continuous: true, pictureCue: { word: 'umbrella', emoji: '☂️' } },
  { id: 'r', display: 'r', continuous: true, pictureCue: { word: 'rabbit', emoji: '🐰' } },
  { id: 'h', display: 'h', continuous: true, pictureCue: { word: 'hat', emoji: '🎩' } },
  { id: 'b', display: 'b', continuous: false, pictureCue: { word: 'bear', emoji: '🐻' } },
  { id: 'f', display: 'f', continuous: true, pictureCue: { word: 'fish', emoji: '🐟' } },
  { id: 'l', display: 'l', continuous: true, pictureCue: { word: 'lion', emoji: '🦁' } },
];

const SETS: LetterSet[] = [
  { id: 'set1', label: 'Set 1', letterIds: ['s', 'a', 't', 'p', 'i', 'n'] },
  { id: 'set2', label: 'Set 2', letterIds: ['m', 'd', 'g', 'o', 'c', 'k'] },
  { id: 'set3', label: 'Set 3+', letterIds: ['ck', 'e', 'u', 'r', 'h', 'b', 'f', 'l'] },
];

const WORDS: WordEntry[] = [
  // Set 1 words
  { word: 'at', letters: ['a', 't'], setId: 'set1' },
  { word: 'sat', letters: ['s', 'a', 't'], setId: 'set1' },
  { word: 'pat', letters: ['p', 'a', 't'], setId: 'set1' },
  { word: 'tap', letters: ['t', 'a', 'p'], setId: 'set1' },
  { word: 'tip', letters: ['t', 'i', 'p'], setId: 'set1' },
  { word: 'pin', letters: ['p', 'i', 'n'], setId: 'set1' },
  { word: 'pan', letters: ['p', 'a', 'n'], setId: 'set1' },
  { word: 'nap', letters: ['n', 'a', 'p'], setId: 'set1' },
  { word: 'sip', letters: ['s', 'i', 'p'], setId: 'set1' },
  // Set 2 words
  { word: 'mad', letters: ['m', 'a', 'd'], setId: 'set2' },
  { word: 'dog', letters: ['d', 'o', 'g'], setId: 'set2' },
  { word: 'cat', letters: ['c', 'a', 't'], setId: 'set2' },
  { word: 'cot', letters: ['c', 'o', 't'], setId: 'set2' },
  { word: 'kid', letters: ['k', 'i', 'd'], setId: 'set2' },
  { word: 'mop', letters: ['m', 'o', 'p'], setId: 'set2' },
];

const LETTERS_MAP: Record<LetterId, LetterEntry> = Object.fromEntries(
  LETTER_ENTRIES.map(entry => [entry.id, entry])
);

export const LETTERS_EN: LettersContent = {
  languageCode: 'en',
  sets: SETS,
  letters: LETTERS_MAP,
  words: WORDS,
};

export default LETTERS_EN;
