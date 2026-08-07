- `useCounting.ts` — pure round/session state machine. Tracks tap-order counting
  (not array index), round 1→N progression (N = the selected level's
  `maxCount`, see `constants/levels.ts`), and persists both
  `highestCountReached` and the chosen level to AsyncStorage. No side effects
  run inside a `setState` updater; storage writes and sound happen in
  event-handler code, not updater callbacks. Changing level mid-round
  discards the in-progress round and restarts cleanly at round 1.
- `useSound.ts` — wraps `expo-audio` (bundled pop/chime SFX), `expo-speech`
  (spoken numbers, cardinality restate, bridge prompts), and `expo-haptics`
  (light tap feedback). Works unchanged on native and web — all three Expo
  packages ship a web implementation.
