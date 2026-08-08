- `useCounting.ts` — pure round/session state machine. Tracks tap-order counting
  (not array index), round 1→N progression (N = the selected level's
  `maxCount`, see `constants/levels.ts`), and also owns which counting subject
  is active (`constants/subjects.ts`, e.g. ocean fish vs. shapes). Persists
  `highestCountReached`, the chosen level, and the chosen subject to
  AsyncStorage. No side effects run inside a `setState` updater; storage
  writes and sound happen in event-handler code, not updater callbacks.
  Changing level or subject mid-round discards the in-progress round and
  restarts cleanly at round 1. `Phase` includes a `'peeking'` value: any
  level with `LevelConfig.peek` set (currently just Subitizing) starts each
  round there instead of `'playing'` — `tapItem` is a no-op while peeking,
  and the exposed `endPeek()` action (called by App.tsx after a fixed delay)
  reveals the round for normal tap-to-count play.
- `useSound.ts` — wraps `expo-audio` (bundled pop/chime SFX), `expo-speech`
  (spoken numbers, cardinality restate, bridge prompts), and `expo-haptics`
  (light tap feedback). Works unchanged on native and web — all three Expo
  packages ship a web implementation.
- `useLetters.ts` — pure progression state for the Letters (phonics) vertical.
  Language-agnostic by design (see LETTERS-VERTICAL-BRIEF.md §7): every
  exported helper (`flattenSequence`, `nextLetterToIntroduce`,
  `learnedLetters`, `playableWords`) takes a `LettersContent` value as data
  rather than assuming English/SATPIN, so a future `letters.pt.ts` can drive
  the same engine. The hook wraps that with `learnedIds` state persisted to
  AsyncStorage, `currentLetterId` (the next not-yet-learned letter in
  sequence order), `markLearned`, and `resetProgress` — same
  read-in-event-handler pattern as `useCounting.ts`, no side effects inside a
  `setState` updater.
- `usePhonics.ts` — wraps `expo-audio` for phoneme/word playback: one
  pre-created `AudioPlayer` per letter and per word (via `createAudioPlayer`,
  not the `useAudioPlayer` hook, since the set is too large/dynamic to call a
  hook per key), plus `playBlend()` for the Stage C "slow blend" sequence
  (each letter's sound, then the whole word). Deliberately not TTS — see
  `assets/audio/phonics/README.md`. Every key currently points at a single
  non-speech placeholder blip until real recordings are dropped in.
