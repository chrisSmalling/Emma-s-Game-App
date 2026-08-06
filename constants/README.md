Design tokens and rules for the Little Counter — Ocean Edition

Contract (read this before adding UI colors, fonts, or motion):

- Palette: Use only colors exported from constants/theme.ts. Do not hardcode colors in components.
  This keeps the app visually consistent. If you need a new color, add it to theme.ts and get approval.

- Font: The app uses a single rounded family: Fredoka. Do not introduce another font.
  Numbers should use the heaviest available weight in the Fredoka family.

- Motion: Use the motion tokens in theme.MOTION. Taps use the spring config; bubbles use the bubble timing; celebration uses the single Lottie.

- One Lottie rule: Only one Lottie animation (a CC0/commercial-safe bubbles/stars) is used for the round-complete celebration. Do not use Lottie for taps or small transitions.

- No network / no analytics: The app must remain local-only. Do not add third-party tracking or network calls.

- Accessibility: Keep hit targets generous and expose accessible labels/hints. Follow the accessibility guidance in the repo.

Files added:
- constants/theme.ts — exported COLORS, SPACING, TYPE, MOTION tokens and a default theme export.

How to use:
- import { COLORS, SPACING, TYPE, MOTION } from '../constants/theme';
- Use COLORS.deepWater, SPACING.m, TYPE.title, MOTION.spring in components.

Next steps to wire fonts:
- Install @expo-google-fonts/fredoka and expo-font, then load the Fredoka family in App startup and map TYPE.fontFamily to the loaded font name.

If you want a different token (additional spacing or type sizes), add it here and I will keep the tokens authoritative.
