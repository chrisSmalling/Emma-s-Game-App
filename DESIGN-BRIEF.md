# Little Counter — Ocean Edition: Design Brief

This is the locked source of truth for the build. Do not deviate from the
contracts below without an explicit instruction to change them.

## Palette (locked)

Exported from `constants/theme.ts` as `COLORS`. Never hardcode these colors
anywhere else — always import `COLORS` from theme.

| Token | Value |
|---|---|
| `deepWater` | `#0A4D6E` |
| `midWater` | `#1B98D5` |
| `surfaceWater` | `#7FD8F7` |
| `sand` | `#F4E4C1` |
| `counted` | `#34D1A6` |
| `celebration` | `#FFD34E` |
| `accent` | `#FF8A5B` |
| `fish` | `['#FF9F43', '#FF6B9D', '#FFD34E']` |

## Font (locked)

Fredoka only, via `@expo-google-fonts/fredoka`. No second font anywhere.
Numbers use the heaviest available weight. `@expo-google-fonts` registers
each weight as its own family name (there's no single `"Fredoka"` family to
pair with `fontWeight`) — `constants/theme.ts` exports `TYPE.fontFamily`
(regular), `TYPE.fontFamilySemiBold`, and `TYPE.fontFamilyBold`; use the
right one directly instead of setting `fontWeight`.

## Motion (locked)

- Taps: `react-native-reanimated`'s `withSpring` with a gentle overshoot.
- Bubbles: slow rise + sway.
- Celebration: exactly ONE water-themed Lottie animation, played only at
  round complete. Nothing else uses Lottie.

## Non-negotiables

- Collect nothing: no network calls, no analytics, no accounts. Local only.
- No fail state, no timers, no harsh sounds.
- Celebration is a full-screen overlay that REPLACES the scene — it never
  draws over the fish.
- Counting is by TAP ORDER, not array index.
- Counting logic lives in a pure, testable `hooks/useCounting.ts`.

## Stack

Install with `npx expo install` (or pin to the SDK's bundled compatibility
table when the Expo version-check API isn't reachable):
`expo-audio` (not `expo-av`), `expo-speech`, `react-native-reanimated` +
`react-native-worklets`, `expo-haptics`, `expo-linear-gradient`,
`react-native-svg`, `lottie-react-native`, `@expo-google-fonts/fredoka`.

## Component structure

```
components/OceanBackground.tsx
components/Fish.tsx
components/CountBubble.tsx
components/CelebrationOverlay.tsx
components/ParentGate.tsx
hooks/useCounting.ts
hooks/useSound.ts
constants/theme.ts
App.tsx            — composition only
```

## Staged build order

Work one stage at a time; don't skip ahead.

- **Stage 0 — Foundation**: migrate off `expo-av`, install animation deps
  (reanimated + worklets + haptics), fix counting to tap order with all
  side effects out of `setState` updaters, extract a pure
  `hooks/useCounting.ts` with unit tests, create `constants/theme.ts`
  (palette + spacing scale + type scale).
- **Stage 1 — Ocean look & motion**: `OceanBackground`, `Fish` with
  Reanimated tap spring + idle bob, `CountBubble`, Fredoka loaded, the ocean
  gradient.
- **Stage 2 — Sound & feel**: `hooks/useSound.ts` (expo-audio SFX,
  expo-speech, expo-haptics), fired together on tap; chime + spoken total +
  real-world prompt on round complete.
- **Stage 3 — Celebration & polish**: `CelebrationOverlay` with the one
  Lottie animation, `ParentGate` polish, session-complete screen.
- **Stage 4 (v2 seed)**: age levels / difficulty scaffold. Not built until
  asked.
