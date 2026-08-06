# Audio

- `pop.wav`, `chime.wav` — small, calm SFX synthesized in-code (no external
  license needed). `pop` plays on every tap, `chime` plays once when a round
  completes.
- Spoken numbers, the cardinality restate ("Three fish!"), and the real-world
  bridge prompts are all text-to-speech via `expo-speech` — no recorded voice
  clips are bundled yet.

To swap in a real recorded voice later (recommended — kids respond strongly
to a parent's voice): record short clips ("one", "two", ... "five", plus the
bridge prompts) as `.wav`/`.mp3` files here, `require()` them in
`hooks/useSound.ts`, and play them instead of calling `Speech.speak()`.
