Placeholder audio files are not included in the repo to avoid large binary commits.

This folder should contain the following files for full audio behavior on web and native:

- assets/audio/bubble-pop.mp3   // short bubble pop SFX (100-300ms)
- assets/audio/chime.mp3        // gentle chime for round complete
- assets/audio/confetti.mp3     // small celebration clip (optional)
- assets/audio/1.mp3 ... 5.mp3   // optional recorded number clips if you provide them

For now the web audio wrapper falls back to TTS if SFX files are missing. To use real audio, download CC0 Kenney audio clips and place them here.

Recommended sources (CC0):
- https://kenney.nl/assets

After adding the .mp3 files, run `npx expo start --web` and the bundler will include them automatically.
