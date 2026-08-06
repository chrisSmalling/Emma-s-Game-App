# Little Counter — Ocean Edition: Design & Build Brief

> A brief for building the app with Copilot in the repo. It supplies the design
> decisions Copilot can't make on its own (art direction, feel, sound), plus a
> staged task list. Work the stages in order — the look depends on the
> foundation being fixed first.

---

## 0. What "fun" means for a 2-year-old (the target)

The bar isn't "colorful." It's: **every touch produces an immediate, delightful,
physical-feeling reaction, and nothing can go wrong.** Three rules drive every
decision below:

- **Instant response.** A tap must do something within a frame — bounce, sound,
  bubble. Delay = a toddler taps again and gets confused.
- **Everything springs.** No linear fades. Objects overshoot and settle like
  they have weight. This is 80% of "alive."
- **No sharp edges, no failure.** Rounded everything, soft colors, no timers, no
  wrong answers, no harsh sounds.

---

## 1. Art direction — the Ocean world

### Palette (use these exact values so it stays cohesive)
- Deep water (bottom gradient): `#0A4D6E`
- Surface water (top gradient): `#7FD8F7`
- Mid water: `#1B98D5`
- Sandy floor: `#F4E4C1`
- "Correct / counted" glow: sea-foam `#34D1A6`
- Celebration highlight: sunny `#FFD34E`
- Accent / buttons: coral `#FF8A5B`
- Fish: playful warm tones (orange `#FF9F43`, pink `#FF6B9D`, yellow `#FFD34E`)

### Layout (three fixed zones — this also fixes the overlap bug)
- **Top band:** title + running count. Never overlaps the play area.
- **Middle scene:** the water, with the fish. This is the stage.
- **Bottom band:** the prompt + Next.
- **Celebration:** a full-screen overlay that *replaces* the scene, it does NOT
  render on top of the fish. (The current overlap is because congrats + confetti
  are absolutely positioned over the play area — separate them.)

### Characters & scene
- Countable objects are **friendly fish** that gently bob/idle-animate even
  before being tapped (a static object feels dead).
- Background: a vertical water **gradient** with a soft **sandy floor**, a few
  slow **rising bubbles**, and gently swaying **seaweed** for life.
- When a fish is counted: it does a happy wiggle, a bubble pops, and a **number
  appears inside a bubble** above it (sea-foam glow).

### Typography
- Rounded, chunky, friendly: **Fredoka** or **Baloo 2** (both free Google Fonts,
  load via `@expo-google-fonts`). Numbers in the heaviest weight available.

### Motion language
- Tap: fish scales up ~1.25 with a spring overshoot, wiggles, settles.
- Bubbles: rise and drift with slight horizontal sway.
- Celebration: fish gather, bubbles + stars rise, a big number floats up in a
  bubble. Warm, slow, earned — not a slot machine.

---

## 2. Asset strategy (you asked me to recommend — here it is)

**Recommendation: hybrid, leaning on free CC0 packs so you don't need a designer,
with code for anything animated.** This keeps licensing clean for selling later.

1. **Fish & sea creatures → Kenney.nl (CC0).** Look at "Fish Pack" and "Animal
   Pack (Sea)." CC0 means *public domain* — free for commercial use, no
   attribution required. Cohesive, game-ready PNGs you drop into `assets/`.
   - *If you later want a unique hand-illustrated look:* generate a custom fish
     set with an AI image tool, prompting one consistent style, transparent
     backgrounds. Check that tool's commercial-use terms before shipping.
2. **Background, bubbles, waves, seaweed → code, not assets.** Use
   `expo-linear-gradient` for the water and Reanimated/SVG for bubbles + sway.
   Cleaner, scalable, tiny, fully controllable.
3. **Celebration → Lottie.** Grab a free bubbles/confetti/stars animation from
   **LottieFiles** and play it with `lottie-react-native`. This single swap is
   the biggest jump from "janky emoji" to "real app."
4. **Sound → Kenney audio packs (CC0).** "Impact/UI" and water/bubble SFX.

> **Licensing note (matters because you plan to sell this):** stick to **CC0 /
> public-domain** assets (Kenney is CC0). Many "free" asset sites are *not*
> commercial-safe. When in doubt, don't ship it.

---

## 3. Tech stack (SDK 54-correct — verify against your repo)

Your repo is on Expo SDK ~54. Install with `npx expo install` so versions match.

| Need | Library | Notes |
|---|---|---|
| Audio SFX | **expo-audio** (`useAudioPlayer`) | **Migrate off expo-av** — it's deprecated and removed in SDK 55 |
| Spoken numbers | **expo-speech** | TTS now; swap to your own recorded clips later |
| Animation | **react-native-reanimated** (v4) | **Also install `react-native-worklets`** — required on SDK 54+ |
| Easy declarative animation (optional) | **moti** | Sits on Reanimated; makes springs one-liners |
| Celebration | **lottie-react-native** | Plays LottieFiles animations |
| Haptics | **expo-haptics** | Light impact on each tap |
| Water gradient | **expo-linear-gradient** | Background |
| Vector shapes | **react-native-svg** | Bubbles, seaweed, waves |
| Fonts | **@expo-google-fonts/fredoka** (or baloo-2) | Rounded typography |

Keep the **collect-nothing** rule from the original spec: no network, no
analytics, no accounts. Local device only.

---

## 4. Sound design

- **On each tap:** a soft "blub"/bubble-pop SFX (expo-audio) + light haptic
  (expo-haptics) + the spoken number (expo-speech). All three fire together —
  that combination is what makes it feel physical.
- **On round complete:** a gentle chime + spoken cardinality restate ("Three
  fish!") + the real-world bridge prompt ("Now count your fingers!").
- **Keep it calm.** No loud, sharp, or startling sounds. Toddler-safe volume.
- Voice: expo-speech now; when you're ready, record your own voice counting and
  drop the clips in — kids respond strongly to a parent's voice.

---

## 5. Component architecture

Break the monolith `App.tsx` into pieces so Copilot can work on one thing at a
time and the repo reads well as a portfolio piece:

```
/components
  OceanBackground.tsx   // gradient + sand + bubbles + seaweed
  Fish.tsx              // one tappable fish: idle bob + tap spring + number bubble
  CountBubble.tsx       // the number-in-a-bubble that appears when counted
  CelebrationOverlay.tsx// full-screen Lottie + big total + "say it together"
  ParentGate.tsx        // press-and-hold gate -> settings
/hooks
  useCounting.ts        // round state, tap-order counting, cardinality logic
  useSound.ts           // wraps expo-audio + expo-speech + expo-haptics
/constants
  theme.ts              // the palette + spacing + type scale above
App.tsx                 // composition only
```

The counting logic (tap order, one number per fish, cardinality on completion)
lives in `useCounting.ts` — keep it pure and unit-testable. That hook is your
"real engineering" story for interviews.

---

## 6. Staged Copilot task list (do in order)

Give Copilot one stage at a time. Don't skip ahead — later stages assume the
earlier ones landed.

### Stage 0 — Foundation & fixes
> Migrate the app from expo-av to expo-audio (use the useAudioPlayer hook).
> Install react-native-reanimated and react-native-worklets and expo-haptics via
> `npx expo install`. Fix the counting so the spoken/displayed number follows
> TAP ORDER, not array index: track a running counter, assign each object its
> number when first tapped, store it so re-taps replay the correct number. Move
> all side effects (sound, state increments) OUT of any setState updater so
> Strict Mode can't double-count. Extract the counting logic into a pure
> hooks/useCounting.ts. Confirm it runs.

### Stage 1 — The ocean look
> Add a constants/theme.ts with this palette [paste palette]. Build an
> OceanBackground component: vertical water gradient (expo-linear-gradient),
> sandy floor, a few slow rising bubbles and swaying seaweed (react-native-svg +
> reanimated). Replace the emoji "ducks" with a Fish component using the Kenney
> fish PNGs in assets/. Fish idle-bob gently and, on tap, do a spring scale+wiggle
> (reanimated withSpring). Load the Fredoka font. Put the celebration in a
> separate full-screen overlay that REPLACES the scene rather than drawing over
> the fish.

### Stage 2 — Sound & feel
> Add hooks/useSound.ts wrapping expo-audio (bubble-pop + chime SFX from
> assets/audio), expo-speech (speak each number, then restate the total as
> "N fish!"), and expo-haptics (light impact). Fire pop + haptic + spoken number
> together on each tap. On round complete, play chime + spoken total + a
> "Now count your fingers!" prompt.

### Stage 3 — Celebration & polish
> Add lottie-react-native and a CelebrationOverlay that plays a free bubbles/stars
> Lottie with the big total in a bubble and "Say it out loud together!". Polish
> the ParentGate and the session-complete "Play again" screen to match the ocean
> theme.

### Stage 4 — (v2 seed) age levels
> Scaffold a difficulty model in useCounting.ts mapping to the developmental
> ladder: Level 1 rote counting (voice models, 1–3), Level 2 one-to-one (1–5),
> Level 3 cardinality emphasis, Level 4 subitizing (flash small sets). Wire a
> level picker behind the parent gate. Build the UI later.

---

## 7. "It feels like a real app" — definition of done for the redesign

- [ ] Fish (real art), not emoji, on a gradient ocean with living background.
- [ ] Every tap: spring animation + bubble-pop sound + haptic + spoken number, together.
- [ ] Counting is by tap order; cardinality restated aloud each round.
- [ ] Celebration is a Lottie overlay that replaces the scene (no overlap).
- [ ] Rounded friendly font throughout; the palette above used consistently.
- [ ] Runs on device via Expo Go; still collects zero data.
- [ ] Logic lives in useCounting.ts, tested; components are separated.
- [ ] Tested on your daughter, with notes on what held her.

Build Stage 0–3 and you have a genuinely fun, evidence-based single activity —
the real MVP. Stage 4 opens the road to the product.
