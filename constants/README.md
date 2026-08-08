Design tokens and rules for the Little Counter — Ocean Edition

Contract (read this before adding UI colors, fonts, or motion):

- Palette: Use only colors exported from constants/theme.ts. Do not hardcode colors in components.
  This keeps the app visually consistent. If you need a new color, add it to theme.ts and get approval.

- Font: The app uses a single rounded family: Fredoka. Do not introduce another font.
  Numbers should use the heaviest available weight in the Fredoka family.

- Motion: Use the motion tokens in theme.MOTION. Taps use the spring config; bubbles use the bubble timing.

- Celebration is exactly ONE water-themed Lottie animation (assets/lottie/celebration.json), played once at round complete via CelebrationOverlay. Nothing else uses Lottie. On web this renders through @lottiefiles/dotlottie-react's WASM engine — see components/lottieWasmSetup.web.ts for why that needs a locally-bundled .wasm instead of its default CDN fetch (the app must run offline).

- No network / no analytics: The app must remain local-only. Do not add third-party tracking or network calls.

- Accessibility: Keep hit targets generous and expose accessible labels/hints. Follow the accessibility guidance in the repo.

Files added:
- constants/theme.ts — exported COLORS, SPACING, TYPE, MOTION tokens, a
  withOpacity(hex, opacity) helper for translucent fills (use this instead
  of hand-writing an rgba() literal), and a default theme export.

How to use:
- import { COLORS, SPACING, TYPE, MOTION, withOpacity } from '../constants/theme';
- Use COLORS.deepWater, SPACING.m, TYPE.title, MOTION.spring in components.

Next steps to wire fonts:
- Install @expo-google-fonts/fredoka and expo-font, then load the Fredoka family in App startup and map TYPE.fontFamily to the loaded font name.

If you want a different token (additional spacing or type sizes), add it here and I will keep the tokens authoritative.

Other data-driven content in this folder (same pattern: typed config,
consumed generically by engine code, never hardcoded):
- `levels.ts` / `subjects.ts` — the Counting activity's difficulty levels and
  countable subjects (ocean fish, shapes, colors, letter shapes).
- `activities.ts` — the app's top-level activities (Counting, Letters). See
  LETTERS-VERTICAL-BRIEF.md §8 — Letters is a sibling vertical, not a
  Counting subject, so it's a peer entry here rather than in subjects.ts.
- `letters.en.ts` — the English phonics curriculum for the Letters vertical:
  SATPIN-ordered letter sets, per-letter picture cues, and CVC word lists.
  Language-keyed by design — see the file header and
  LETTERS-VERTICAL-BRIEF.md §7 for why the engine (`hooks/useLetters.ts`,
  `hooks/usePhonics.ts`) must never assume English.
- `letterStages.ts` — the Letters activity's own internal stages (Practice /
  Sound Match), distinct from `activities.ts` above: this picks a mode
  *within* Letters, not between top-level activities.
