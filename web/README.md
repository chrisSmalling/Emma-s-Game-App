# Web & PWA run instructions

This project supports a web-first workflow so you can iterate on the UX quickly and install the app as a PWA on tablets/phones during development.

1. Install deps

   npm ci

2. Start the dev server (web)

   npx expo start --web

3. Open the served URL in your browser. On iPad/Android you can "Add to Home Screen" to get a PWA-like install.

PWA notes
- The web/manifest.json is included. Add `assets/icon.png` and `assets/icon-512.png` if you want custom icons for the PWA install.
- All assets (images + audio + lottie) should be present under assets/ so they are bundled for offline use.

Audio on web
- The app will use HTMLAudio + window.speechSynthesis on web for SFX and TTS. This keeps the experience immediate without native audio libraries.

If you want me to commit the binary assets directly into the repo (PNG/MP3/JSON), say so and I will add them in the next commit.
