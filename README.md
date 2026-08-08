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
  OceanBackground         gradient + sand + rising bubbles + seaweed
  TappableObject          shared idle-bob + spring-tap + counted-glow + number-bubble
  Fish / Shape /          each subject's visual: a thin TappableObject wrapper
  ColorBlob / LetterShape
  ShapeGraphic            circle/square/triangle/star, drawn with react-native-svg
  CountBubble             the number-in-a-bubble shown when counted
  CelebrationOverlay      full-screen Lottie + total; replaces the scene
  ParentGate              press-and-hold gate -> settings
  SettingsScreen          grown-up settings: activity picker + (Counting only) best score + subject/level pickers + (Letters only) stage picker
  OptionPicker            generic row-list picker (used by all pickers below)
  ActivityPicker          the top-level activity rows (Counting / Letters) shown in Settings
  SubjectPicker           the counting-subject rows shown in Settings
  LevelPicker             the counting-level rows shown in Settings
  LetterStagePicker       the Letters-internal stage rows (Practice / Sound Match) shown in Settings
  lottieWasmSetup.web      pins the Lottie WASM engine to a local asset (web only)
  lottieWasmSetup          no-op on native (native uses platform Lottie engines)
  /letters
    LettersHome           Letters activity root: shared chrome + persisted stage choice (see Roadmap)
    PracticeScreen         Stage A: recognition + sound
    LetterCard             the tappable letter glyph + revealed picture cue (Stage A)
    SoundMatchScreen       Stage B: hear a sound, tap the matching letter
    SoundMatchTile         one Stage B option tile (idle / correct / exploring)
/hooks
  useCounting             round/level/subject/peek state + tap-order counting (pure, tested)
  useSound                wraps expo-audio + expo-speech + expo-haptics
  useLetters              Letters vertical progression state (pure, tested) — see Roadmap
  usePhonics              wraps expo-audio for letter/word phoneme playback — see Roadmap
  useLetterIntroduction   Stage A rotation/session logic (pure, tested) — see Roadmap
  useSoundMatch           Stage B round/feedback logic (pure, tested) — see Roadmap
/constants
  theme                   palette tokens, spacing scale, type scale, withOpacity()
  levels                  the four-level developmental scaffold (see Roadmap)
  subjects                the four counting subjects (see Roadmap)
  activities              the app's top-level activities: Counting, Letters
  letterStages            the Letters activity's internal stages: Practice, Sound Match
  letters.en              English phonics curriculum (SATPIN order, picture cues, CVC words)
App.tsx                   Root (persisted activity choice) -> Game (Counting) or LettersHome
```

- **`useCounting`** holds all counting logic and is covered by unit tests. Side
  effects (sound, haptics, persistence) live outside React state updaters so
  Strict Mode / the New Architecture cannot double-count.
- **Design tokens only.** Every color comes from `constants/theme.ts`; no color
  is hardcoded in a component. A `withOpacity(hex, opacity)` helper covers
  translucent cases (e.g. modal backdrops) so even those reference the palette.
- **Subjects are thin visual wrappers.** `TappableObject` owns all the shared
  tap/motion/counted-state behavior; `Fish`, `Shape`, `ColorBlob`, and
  `LetterShape` each just supply what goes inside it (an `Image`, an SVG
  shape, a colored `View`, or a `Text` glyph) plus an `objectLabel` for
  accessibility. Adding a future subject means writing one small wrapper
  component and a `constants/subjects.ts` entry — the counting engine,
  motion, and sound don't change.
- **Activities are top-level siblings, not Counting subjects.** `App.tsx`'s
  `Root` component owns a persisted `activityId` and renders either `Game`
  (Counting) or `LettersHome` (Letters) — never both, so each activity's
  hooks (and their audio players) only mount while that activity is active.
  `SettingsScreen` always shows the `ActivityPicker`; the subject/level
  pickers only render when the active screen passes counting-specific props,
  which `LettersHome` doesn't. See `LETTERS-VERTICAL-BRIEF.md` for why
  Letters is a peer vertical rather than a fifth counting subject.

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

`react-native-svg` draws the Shapes subject's circle/square/triangle/star
(`components/ShapeGraphic.tsx`). The ocean scene itself (bubbles, seaweed,
sand) still uses CC0 sprite assets rather than hand-drawn vectors.

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

v2: everything from spec.md §9's "out of scope for v1" list except the
subscription. Both pickers below live behind the parent gate in Settings and
both persist locally the same way the high score does; switching either
restarts the session cleanly at round 1 (a swap mid-round would leave a
stale item count or counted-state from the old one).

**Difficulty levels** (`constants/levels.ts`), mapped onto the developmental
ladder:

- **Rote Counting** (ages ~2) — rounds 1 to 3.
- **One-to-One** (ages ~3) — rounds 1 to 5. Default, and identical to v1's
  original behavior.
- **Cardinality** (ages 2–4) — rounds 1 to 5, and the round-complete moment
  asks "How many [fish/shapes/...] are there?" before answering, leaning
  harder into the last-number-is-the-total concept.
- **Subitizing** (ages ~4–5) — each round opens with a brief (1.6s),
  non-interactive "peek" at the whole set — objects visible and idle-bobbing,
  but not tappable, with a spoken "Look closely!" cue and no numbers said (that
  would just be counting). It then becomes a normal tap-to-count round.
  Deliberately *not* a flash-then-hide-then-guess quiz: spec.md's "no fail
  state" rule rules out a graded right/wrong answer, so there's no wrong
  answer to give — the peek is an invitation to glance, then the count
  round is where you check together. `useCounting`'s `Phase` type gained a
  `'peeking'` value for this; `TappableObject` gained an `interactive` prop
  so peeking objects render but don't respond to taps.

**Counting subjects** (`constants/subjects.ts`), reusing the same tap-order
engine with different objects — each is a `TappableObject` wrapper, see
Architecture above:

- **Ocean Fish** — the original. Default.
- **Shapes** — circle/square/triangle/star, drawn with `react-native-svg`.
- **Colors** — solid-color circles, a distinct set of locked-palette swatches.
- **Letter Shapes** — big bold A–E glyphs. Counts objects that happen to be
  letters; doesn't teach letter sounds or names. (Renamed from "Letters" to
  avoid colliding with the separate Letters *activity* below, which does
  teach letter sounds.)

v2 (still not built — the one deliberately deferred item): a **parent-gated
subscription**. This is a different kind of work than everything above: real
in-app-purchase products configured in App Store Connect / Google Play
Console, a purchase flow, entitlement gating, and platform-specific payment
code that can't be meaningfully verified from a web sandbox the way
everything else in this README was. Needs real device testing and store
account access before it's built.

---

## Letters — a second activity vertical

Letters (phonics) is a second top-level activity alongside Counting, per
`LETTERS-VERTICAL-BRIEF.md` — a full design brief covering pedagogy (SATPIN
letter order, sounds-before-names, blending), the "supportive tutor" no-fail
feedback pattern adapted for a domain that (unlike counting) has right/wrong
answers, and a staged build plan (L0–L4). It reuses the Counting app's theme,
fonts, motion tokens, and offline-first privacy model — nothing new was added
to the tech stack.

**Stage L0 — Foundation (done):** the data model, the audio-playback hook,
and the Letters entry point in the Settings activity picker.

- `constants/letters.en.ts` — the English curriculum: SATPIN-ordered letter
  sets, per-letter picture cues (`s` → 🐍 snake), and CVC word lists,
  structured so a future `letters.pt.ts` can plug into the same engine
  (brief §7 — language-keyed, not English-only).
- `hooks/useLetters.ts` — pure, tested progression state: which letters are
  learned, and the next one to introduce, persisted to AsyncStorage the same
  way `useCounting` persists its own state.
- `hooks/usePhonics.ts` — letter/word audio playback via `expo-audio`,
  deliberately *not* TTS (`expo-speech`), since synthesized speech
  mispronounces isolated phonemes (brief §5).

**Stage L1 — Recognition + sound (done):** `components/letters/
PracticeScreen.tsx` + `hooks/useLetterIntroduction.ts`. One letter at a time
in SATPIN order; tapping it plays its sound and reveals its picture cue; a
calm "Next" control advances, revisiting every already-learned letter before
introducing a new one. Pure exposure — no quiz, no score.

Every letter and word clip is real, distinct audio — not a recording, not
runtime TTS — generated locally and offline by `scripts/
generate-phonics-audio.mjs` (eSpeak NG, run once at dev time; never an app
dependency, never imported by app code, never called at runtime). See
`assets/audio/phonics/README.md` for the full phoneme table and known
trouble spots (voiced stops need a trailing glottal stop to be audible at
all; short vowels get mangled into the wrong vowel by default; `r` is a
genuine eSpeak limitation with no clean fix). A parent's own recorded voice
remains the intended real answer per the brief — this pipeline is a large,
honest step up from silence, not the finish line.

**Stage L2 — Sound matching (done):** `components/letters/
SoundMatchScreen.tsx` + `hooks/useSoundMatch.ts`. The app plays a target
sound (tap the 🔊 prompt card to hear/replay it — nothing auto-plays without
a tap, since browsers block audio that isn't a direct response to a user
gesture), 2–3 already-learned letters are shown, the child taps one:

- **Correct** — the tile gets a bigger celebratory bounce, a sparkle burst
  (reusing `TapBurst`), a green glow, and a confirmation chime, then the app
  auto-advances to a new round after a beat.
- **Not a match** — no fail sound, no score, no red anywhere. The tapped
  letter gets the *exact same* gentle reaction as an ordinary tap (never a
  lesser one) and says its own sound, then — after a short pause — the app
  re-invites by replaying the target sound on the same round with the same
  options, per the brief's "supportive tutor" pattern (§4).

Reachable via Settings → "Letters mode" (`LetterStagePicker`), which
`components/letters/LettersHome.tsx` (now the activity's root — it owns the
persisted stage choice and the shared chrome, delegating the actual screen
to `PracticeScreen` or `SoundMatchScreen`) wires up alongside the existing
Counting pickers, reusing the same "optional props, conditionally rendered"
pattern `SettingsScreen` already used for subject/level.

**Not yet built** (per the brief's own staging, each stage ships and is
confirmed before the next starts): L3 (WordBuilder blending), L4 (Set 2 +
mastery tracking). Real recorded voice audio, a Portuguese curriculum layer,
more letter sets, and tracing/handwriting are all explicitly out of scope
until requested (brief §9, "Later (separate)").
