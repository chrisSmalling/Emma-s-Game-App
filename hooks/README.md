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
