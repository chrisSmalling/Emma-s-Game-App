- `useCounting.ts` — pure round/session state machine. Tracks tap-order counting
  (not array index), round 1→5 progression, and persists `highestCountReached`
  to AsyncStorage. No side effects run inside a `setState` updater; storage
  writes and sound happen in event-handler code, not updater callbacks.
- `useSound.ts` — wraps `expo-audio` (bundled pop/chime SFX), `expo-speech`
  (spoken numbers, cardinality restate, bridge prompts), and `expo-haptics`
  (light tap feedback). Works unchanged on native and web — all three Expo
  packages ship a web implementation.
