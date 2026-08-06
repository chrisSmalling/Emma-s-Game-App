# Web & PWA run instructions

This project supports a web-first workflow so you can iterate on the UX quickly and install the app as a PWA on tablets/phones during development.

1. Install deps

   npm install

2. Start the dev server (web)

   npx expo start --web

3. Open the served URL in your browser. On iPad/Android you can "Add to Home Screen" to get a PWA-like install.

PWA notes
- `web/manifest.json` and the icons it references (`assets/icon.png`, `assets/icon-512.png`) are committed.
- All assets (fish/ocean images + audio) are committed under `assets/` so they're bundled for offline use.

Audio on web
- `hooks/useSound.ts` uses `expo-audio`, `expo-speech`, and `expo-haptics` directly — all three ship a web implementation, so no separate web-only sound wrapper is needed.
