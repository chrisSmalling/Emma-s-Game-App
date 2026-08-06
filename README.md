# Little Counter — Ocean Edition

A counting app for a ~2–3-year-old, built to actually teach counting (rote
counting → one-to-one correspondence → cardinality) and to be tested with a
real toddler before anything else gets added. See `spec.md` for the full
build spec and `ocean-counting-build-brief.md` for the art/motion direction.

## Run it (web-first)

```
npm install
npm run web
```

This starts the Expo dev server and opens the app in your browser
(`react-native-web`). Use this to iterate quickly and test with your
daughter on a laptop/tablet browser before touching native builds.

To try it as a native app via Expo Go, run `npm start` and scan the QR code.

## What's built (v1)

- One counting activity, five rounds per session (1 fish → 5 fish).
- Tap-order counting: each fish gets its spoken number the moment it's
  tapped; counted fish stay glowing; re-tapping a counted fish just replays
  its number (no wrong answers, ever).
- Every round ends with the total restated aloud ("Three fish!"), a real-world
  bridge prompt ("Now count your fingers!"), and a co-play line for the
  grown-up ("Count out loud together!").
- After 5 rounds, a gentle stopping point — no infinite loop.
- Press-and-hold parent gate opens a placeholder settings screen.
- Runs fully offline; works with airplane mode on.

## Privacy by design

This app collects nothing. No accounts, no network calls, no analytics SDKs,
no microphone, no camera, no location, no device identifiers. The only thing
stored is `highestCountReached` — a single integer, saved locally on the
device via AsyncStorage, never transmitted anywhere.

Because it collects zero personal information, there's nothing to leak and
nothing that needs consent — this is the intentional design, not an
afterthought, and it's why the app can stay COPPA-clean without a privacy
policy full of caveats.

## Tech

Expo SDK 54, TypeScript, React Native. `expo-audio` / `expo-speech` /
`expo-haptics` for feedback, `expo-linear-gradient` + `react-native-svg`
compatible sprites for the ocean scene, `@react-native-async-storage/async-storage`
for the one persisted value. See `hooks/README.md` and `constants/README.md`
for the internal contracts.
