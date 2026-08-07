import { setWasmUrl } from '@lottiefiles/dotlottie-react';

// @lottiefiles/dotlottie-web defaults to fetching its WASM renderer from a
// CDN (jsdelivr/unpkg) on first use. The app must run fully offline, so
// point it at the copy bundled locally instead. Metro resolves this
// require() to a same-origin URL for the web target (see metro.config.js
// for the 'wasm' asset extension registration).
setWasmUrl(require('../assets/lottie/dotlottie-player.wasm'));
