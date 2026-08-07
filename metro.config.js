const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Lottie celebration on web loads via @lottiefiles/dotlottie-web, which
// needs its .wasm renderer bundled as a local asset (see
// components/lottieWasmSetup.web.ts) instead of fetching it from a CDN —
// the app must run fully offline.
config.resolver.assetExts.push('wasm');

module.exports = config;
