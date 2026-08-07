# Little Counter — Ocean Edition

A counting app for toddlers (~ages 2–3), built to teach one-to-one
correspondence and cardinality through tapping, with an ocean theme, spoken
numbers, and tactile feedback. Designed to be genuinely educational and,
equally, **safe by design**.

See `spec.md` for the full build spec and `DESIGN-BRIEF.md` for the locked
art/motion/architecture contracts this build follows.

---

## Run it (web-first)

```
npm install
npm run web
```

This starts the Expo dev server and opens the app in your browser
(`react-native-web`). Use this to iterate quickly and test on a laptop or
tablet browser before touching native builds.

To try it as a native app via Expo Go, run `npm start` and scan the QR code.

---

## Privacy & Safety by Design

This app is built for young children, so its most important architectural
property is what it *doesn't* do: **it collects nothing and talks to no one.**

- **No data collection.** No accounts, no names, no photos, no voice recording,
  no location, no device identifiers. The only things persisted are the
  highest count reached and the chosen counting level, both stored locally
  on the device.
- **No network calls.** The app makes zero outbound requests at runtime. It runs
  fully in airplane mode. There is no telemetry, no analytics SDK, and no
  third-party service that receives any signal about the child or the session.
- **No third-party data SDKs.** Nothing in the dependency tree phones home.
- **COPPA-clean by construction.** Because the app collects no personal
  information from anyone, it falls outside the data-collection obligations of
  the COPPA Rule entirely — there is nothing to consent to, nothing to disclose,
  and nothing to delete. Compliance here is a property of the architecture, not
  a policy bolted on afterward.

### Case study: closing a hidden network call in the animation engine

The single celebration animation is rendered with Lottie. On the web target,
`lottie-react-native` delegates to a WASM-based engine
(`@lottiefiles/dotlottie-react`) that, by default, **fetches its `.wasm` binary
from a public CDN (jsDelivr/unpkg) on first render.**

That default silently violates the app's core guarantee — a child's device
would have made a UI-triggered request to a third-party CDN. It was caught by
auditing actual network traffic on the rebuilt bundle rather than trusting the
library's defaults.

The fix preserves the no-network guarantee end to end:

- **Vendored the `.wasm` binary** into `assets/lottie/` so it ships with the app.
- **Registered `wasm` as a Metro asset extension** (`metro.config.js`) so the
  bundler treats it as a local asset.
- **Pinned the engine to the locally-resolved asset** via `setWasmUrl()` before
  any Lottie renders (`components/lottieWasmSetup.web.ts`), with a **native
  no-op counterpart** (`components/lottieWasmSetup.ts`) — native platforms use
  the OS Lottie engines and never need the WASM path at all.

Verification: on the rebuilt web bundle, there are zero external network
requests; the only `.wasm` request resolves to localhost. The airplane-mode
guarantee holds on the web path as well as native.

> Takeaway: a third-party rendering engine tried to introduce a CDN dependency
> that would have broken the app's privacy contract. Tracing its runtime network
> behavior and closing it off — rather than accepting library defaults — is what
> keeps "collects nothing, runs offline" true under real dependencies.

---

## Educational design

The counting mechanic is grounded in early-numeracy research (Gelman &
Gallistel's counting principles) rather than surface "edutainment":

- **One-to-one correspondence:** each object is tapped once and assigned exactly
  one number, in *tap order* (not array position), so the count reflects what
  the child actually did.
- **Cardinality:** every round restates the total aloud ("Three fish!"), which
  is the specific instructional move that builds the last-number-is-the-total
  concept.
- **No fail state:** no timers, no wrong answers, no penalty sounds — young
  children learn by exploring without fear of failure.
- **Real-world bridge & co-play:** the app invites counting real objects and
  counting aloud together, the modes with the strongest learning evidence.
- **Healthy limits:** rounds reach a natural stopping point rather than looping
  to maximize screen time.

---

## Architecture

Logic and presentation are separated so the counting rules are pure and
testable, and the UI is composed from small components.

```
/components
  OceanBackground        gradient + sand + rising bubbles + seaweed
  Fish                   one tappable fish: idle bob + spring tap + number bubble
  CountBubble             the number-in-a-bubble shown when counted
  CelebrationOverlay      full-screen Lottie + total; replaces the scene
  ParentGate              press-and-hold gate -> settings
  SettingsScreen          grown-up settings: best score + level picker
  LevelPicker             the four counting-level rows shown in Settings
  lottieWasmSetup.web      pins the Lottie WASM engine to a local asset (web only)
  lottieWasmSetup          no-op on native (native uses platform Lottie engines)
/hooks
  useCounting             round/level state + tap-order counting + cardinality (pure, tested)
  useSound                wraps expo-audio + expo-speech + expo-haptics
/constants
  theme                   palette tokens, spacing scale, type scale, withOpacity()
  levels                  the four-level developmental scaffold (see Roadmap)
App.tsx                   composition only
```

- **`useCounting`** holds all counting logic and is covered by unit tests. Side
  effects (sound, haptics, persistence) live outside React state updaters so
  Strict Mode / the New Architecture cannot double-count.
- **Design tokens only.** Every color comes from `constants/theme.ts`; no color
  is hardcoded in a component. A `withOpacity(hex, opacity)` helper covers
  translucent cases (e.g. modal backdrops) so even those reference the palette.

---

## Tech stack

Expo SDK 54, React Native, TypeScript.

| Concern | Library |
|---|---|
| Audio playback (SFX) | `expo-audio` (migrated off the deprecated `expo-av`) |
| Spoken numbers | `expo-speech` |
| Animation | `react-native-reanimated` (+ `react-native-worklets`, required on SDK 54) |
| Celebration | `lottie-react-native` (single, self-authored animation) |
| Haptics | `expo-haptics` |
| Water gradient | `expo-linear-gradient` |
| Typography | `@expo-google-fonts/fredoka` (single font family) |
| Local persistence | `@react-native-async-storage/async-storage` (one integer) |

`react-native-svg` is installed per the design brief's locked stack list but
isn't currently wired into a component — the ocean scene (bubbles, seaweed,
sand) uses CC0 sprite assets instead of hand-drawn vector shapes.

**Locked design contracts:** fixed color palette (tokens only), Fredoka as the
sole font, Reanimated springs for taps, exactly one Lottie for the celebration,
zero network calls, and pure/tested counting logic. See `DESIGN-BRIEF.md`.

---

## Testing & verification

- `npx tsc --noEmit` — type-clean.
- `npm test` — counting-logic unit tests (`hooks/useCounting.test.ts`).
- `npx expo-doctor` — dependency/SDK validation.
- Network audit on the rebuilt web bundle (Playwright) — confirms zero
  external requests at runtime, including the Lottie WASM asset.
- On-device (Expo Go): confirms taps count in tap order, the **native**
  celebration renders, and the app runs in **airplane mode** (confirms no
  runtime network on native, not just web).

---

## Roadmap

v1: one polished counting activity, ocean-themed, evidence-based, offline.

v2 seed (this): a difficulty scaffold behind the parent gate, mapped onto the
developmental ladder (`constants/levels.ts`):

- **Rote Counting** (ages ~2) — rounds 1 to 3.
- **One-to-One** (ages ~3) — rounds 1 to 5. Default, and identical to v1's
  original behavior.
- **Cardinality** (ages 2–4) — rounds 1 to 5, and the round-complete moment
  asks "How many fish are there?" before answering, leaning harder into the
  last-number-is-the-total concept.
- **Subitizing** (ages ~4–5) — listed and selectable-looking in the picker,
  but marked "coming soon" and disabled. Instantly recognizing a small set
  *without* counting it is a genuinely different interaction model (flash,
  hide, ask — no objects to tap), not a variant of the existing loop, so it
  isn't playable yet. Picking it is a no-op.

Selecting a level persists it locally (same mechanism as the high score) and
restarts the session cleanly at round 1 in the new range.

v2 (still deferred): the subitizing minigame itself, additional subjects, and
a parent-gated subscription. Not built until the levels above are validated
with real users.
