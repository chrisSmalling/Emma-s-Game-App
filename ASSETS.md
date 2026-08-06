# ASSETS and licensing

This file documents the CC0 assets I selected for the Ocean Counting build. These are free-to-use (CC0 / public domain / commercial-safe) assets you can drop into the `assets/` folder. I did not add binary assets to the repo to avoid large blobs in git — download them and place them under the paths below.

Recommended assets (CC0 Kenney + LottieFiles)

1) Fish art (Kenney — CC0)
- Source pack: Kenney "Fish Pack" or the Game Icons fish on https://kenney.nl/assets
- Suggested files to add: `assets/fish/fish_orange.png`, `assets/fish/fish_pink.png`, `assets/fish/fish_yellow.png`
- License: CC0 (public domain)

2) Sound effects (Kenney / CC0)
- Bubble pop: `assets/audio/bubble-pop.mp3` (small, ~100-300ms)
- Gentle chime: `assets/audio/chime.mp3` (short, calm)
- Celebration voice (optional fallback): `assets/audio/celebration-voice.mp3` (short "Yay! Great counting!")
- Source: Kenney audio packs (https://kenney.nl/assets)

3) Lottie celebration (bubbles/stars — verify license before shipping)
- Example Lottie (CC0/commercial-safe candidate): https://lottiefiles.com/ (search "bubbles" or "celebration")
- Download and place as `assets/lottie/celebration.json`.

How to add assets
1. Download the PNG/MP3/JSON files to your machine.
2. Place them under the `assets/` path shown above.
3. The app references those paths; when you run `npx expo start --web` the bundler will include them.

If you want, I can also add the binary files to the repo (committed under `assets/`) — say so and I will add them in a follow-up commit.
