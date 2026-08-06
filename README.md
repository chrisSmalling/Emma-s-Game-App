# Little Counter — Repo scaffold

This commit updates the app to use bundled audio clips for voice modeling via expo-av, with a TTS fallback when assets fail.

Notes:
- Added expo-av to dependencies.
- Added placeholder audio files in assets/audio/. Replace these with your recorded clips later.
- The app will try to play bundled clips first and fall back to system TTS if playback fails.

Run locally:
1. npm install
2. npx expo start
3. Open in Expo Go on device (works offline for core logic; audio assets are bundled in the app)

Next steps I can do for you:
- Add short real mp3 clips (I can add sample non-startling clips if you want)
- Improve load-time by preloading sounds at startup
- Add a simple test harness for audio playback

