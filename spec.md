# Little Counter — Build Spec (v1 MVP)

> Source of truth for the build. Every requirement below is deliberate. Where a
> choice is grounded in research, the reason is stated so downstream decisions
> stay aligned. Build **only** what is in "v1 Scope." Everything in "Out of
> Scope" is v2 — do not build it yet.

---

## 1. What this is and why

A counting app for a ~2–3-year-old. Two goals, in priority order:

1. **Actually teach counting** — measured against the early-numeracy research,
   not against how "educational" it looks.
2. **Be a portfolio-grade, deployed app** — real state, real persistence, a
   clean privacy architecture, tested. This is the artifact that demonstrates
   full-stack engineering judgment.

First user is my daughter. She is the QA tester and the motivation. Ship the
smallest thing that works, put it in her hands, then let what she does decide v2.

---

## 2. Non-negotiable principles

These override convenience. If a feature fights one of these, the feature loses.

- **Teach the counting, not the tapping.** Rewards attach to the *counting
  moment*, never to every tap. No slot-machine feedback loops. (Research: piling
  on sounds/effects tips an app from active learning into mere cause-and-effect,
  which *reduces* learning — Four Pillars framework, Hirsh-Pasek et al., 2015.)
- **Collect nothing.** No accounts, no network calls, no analytics SDKs, no
  microphone. If we collect zero personal information, there is nothing to
  consent to and nothing to leak. This is both the COPPA-clean path (amended
  FTC Rule in full force as of April 22, 2026) and the security story.
- **No way to lose.** No timer, no fail sound, no wrong-answer penalty. Toddlers
  learn by exploring without fear of failure.
- **Good solo, excellent with a parent.** The strongest learning happens when a
  caregiver co-plays. Design hooks that invite a parent in rather than assuming
  the child is alone. (Research: co-use bridges the "transfer deficit" — the
  gap where under-2s fail to carry screen learning into the real world.)
- **Bridge to the real world.** Screen counting must point back at real objects,
  or it stays trapped on the screen.
- **Respect healthy limits.** Short sessions, a natural stopping point. Do not
  build an infinite loop designed to maximize time-on-device.

---

## 3. Tech stack & environment

- **Framework:** React Native via **Expo**, **TypeScript**.
  - *Why Expo:* test on a real phone/tablet in minutes (Expo Go, scan a QR
    code). That is what lets the app reach my daughter's hands this week.
- **Runs fully offline.** No fetch calls anywhere in the codebase.
- **Persistence:** `AsyncStorage` (or Expo equivalent), local device only.
  Store exactly one thing in v1: `highestCountReached` (integer).
- **No microphone, no camera, no location, no third-party SDKs.**
- **Audio:** bundled voice clips shipped in the app. Playback only (playing
  sound out is fine and has no privacy implication; recording is what triggers
  the biometric rules — so we never record).

---

## 4. The learning model (this is the spec's spine)

Counting is not one skill. It is a sequence of principles the app should build
in order (Gelman & Gallistel's counting principles; standard developmental
sequence):

| Principle | What it means | How the app builds it |
|---|---|---|
| **Rote counting** (~age 2) | Reciting number words in order | The voice models "one, two, three…" as the child taps |
| **One-to-one correspondence** (~age 3) | Exactly one number word per object | Each object is tapped once; each tap = one number, one time |
| **Cardinality** (ages 2–4) | The *last* number counted is the total | End every round by restating the total: "Three ducks!" |
| **Subitizing** (later, ~4–5) | Instantly seeing "how many" for small sets | v2 — small sets flashed without counting |

v1 targets rote counting + one-to-one + cardinality, in the **1–5 range** (kept
inside the small-set range a young child can grasp). The voice does the modeling
so a 2-year-old who can't yet count independently still has a correct model to
follow.

**This table is also the v2 level structure.** Levels map onto the real
developmental ladder, not arbitrary difficulty. That is the design.

---

## 5. v1 Scope — ONE activity, one screen

The entire MVP is a single counting activity. Build this and nothing else.

### Core loop

1. A scene shows **N identical tappable objects** (start with a simple duck
   shape or emoji), where N is the round's target (cycles 1 → 5).
2. Child taps an object → it does a small bounce + gentle glow, is marked
   "counted," and a bundled voice clip says the running number ("one!" … "two!").
3. Counted objects stay visibly glowing so the child can see what's already been
   counted (supports one-to-one correspondence — no double-counting).
4. When all N are counted → a **brief, single** celebration (a soft chime + one
   confetti burst) and the voice restates the total: **"Three ducks!"**
   (This is the cardinality moment — it is the most important half-second in the
   app. Do not bury it under effects.)
5. A **real-world bridge prompt** appears/plays: e.g. "Now count your fingers!"
   or "How many toes do you have?" (rotates through a small set).
6. A large, obvious **next** control advances to a new round with a different N.

### Session shape

- After ~5 rounds, reach a gentle **natural stopping point** ("Great counting!")
  rather than looping forever. A parent can tap to keep going, but the default
  is to pause. (Respects healthy-limits principle.)

### Parent-gate stub

- Include a **"press and hold to open"** parent gate guarding a placeholder
  Settings screen. Nothing to configure yet — but build the gate pattern now so
  the v2 subscription drops into a compliant, already-tested slot.

---

## 6. Evidence-based design requirements (acceptance criteria)

Treat these as pass/fail, not suggestions:

- [ ] Voice models each number **as** the object is tapped (not after).
- [ ] The final total is **restated aloud** every round (cardinality).
- [ ] Celebration is **one** short, learning-tied moment — not per-tap, not
      escalating. No reward for tapping empty space.
- [ ] A **real-world count prompt** closes every round.
- [ ] At least one **co-play hook** is present (e.g. an optional "Count with
      me!" prompt that addresses the grown-up, encouraging them to count along).
- [ ] No fail state anywhere. Tapping a counted object just re-says its number.
- [ ] All UI is **icon/audio only** — no text a non-reader must parse.
- [ ] Tap targets are large (min ~64pt), well-spaced, hard to miss.
- [ ] Runs with airplane mode on (proves zero network dependence).

---

## 7. Data & privacy (the clean architecture)

**Stored locally:** `highestCountReached` (one integer). Nothing else.

**Never collected, ever:** name, age, photos, voice, location, device
identifiers, usage analytics, advertising IDs. No SDK that phones home.

**Result:** the app is outside COPPA's data-collection obligations by design,
because it collects no personal information at all. Document this in the repo
README as an explicit design decision — it is the security narrative for
interviews ("safe by design: offline-first, no third-party SDKs, no data
collection, COPPA-clean").

---

## 8. Toddler UX rules

- Bright, high-contrast, friendly. Big shapes.
- One primary action visible at a time — never a cluttered screen.
- Generous, forgiving hit areas; ignore accidental multi-touch gracefully.
- Every interaction gives immediate, calm feedback (no harsh or startling sounds).
- Navigation a toddler can't escape into the OS: no external links, no ads, no
  pop-ups, no "rate us" nags.

---

## 9. Out of scope for v1 (this is v2 — do NOT build now)

- Multiple age levels / difficulty progression (the table in §4 becomes this).
- Additional subjects (colors, shapes, letters).
- Subitizing activities.
- The paid **parent-gated subscription** (the stub gate in §5 is where it lands).
- Multiple object types / themes beyond the first.
- Any settings beyond the placeholder screen.

Adding any of these before v1 ships is how this project dies at 40%. Ship first.

---

## 10. Definition of done (v1)

- Single counting activity works end to end, rounds 1–5.
- Voice modeling + cardinality restate + real-world prompt all fire correctly.
- Runs on a physical device via Expo Go, in airplane mode.
- `highestCountReached` persists across app restarts.
- Parent-gate stub opens a placeholder Settings screen.
- README documents the privacy-by-design decision.
- Tested live on the actual target user (my daughter) at least once, with notes
  on what held her attention.

---

## 11. Kickoff prompt for Claude Code

Paste this to start the build:

> Build "Little Counter," a toddler counting app in React Native with Expo and
> TypeScript, per the attached build spec. Start with ONLY the v1 single-activity
> core loop. One screen: display N identical tappable duck objects (N cycles
> 1→5). Tapping an object makes it bounce + glow, marks it counted, and plays a
> bundled voice clip of the running count. Counted objects stay glowing. When all
> are counted, play one short celebration and a voice clip restating the total
> ("Three ducks!"), then show a real-world count prompt ("Now count your
> fingers!"), then a large Next control for a new round. After ~5 rounds, show a
> gentle stopping point. No timer, no fail state, no accounts, no network calls,
> no microphone, no analytics. Persist only highestCountReached to AsyncStorage.
> Include a press-and-hold parent gate guarding a placeholder Settings screen.
> Icon/audio-only UI, large tap targets, suitable for a 2–3-year-old who can't
> read. Use placeholder audio clips I can swap for my own recordings later.
> Confirm it runs in Expo Go with airplane mode on.

Then: get one round working, test it on her, and only then touch v2.
