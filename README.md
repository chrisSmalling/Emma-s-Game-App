# Little Counter — Repo scaffold

This commit adds an Expo + TypeScript scaffold for the Little Counter app (v1 MVP).

Notes:
- Offline-first. No network calls or analytics.
- Uses expo-speech as a fallback placeholder for bundled audio clips. You can replace TTS with bundled clip playback via expo-av and require('./assets/audio/1.mp3').
- Persistence: AsyncStorage stores `highestCountReached`.

Run locally:
1. npm install
2. npx expo start
3. Open in Expo Go on device (works offline for core logic; Text-to-Speech uses system TTS)

Next steps I can do for you:
- Add real bundled audio assets and demo clips
- Improve animations and add confetti asset
- Add tests and CI

