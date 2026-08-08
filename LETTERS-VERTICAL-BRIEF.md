# Little Learner — Letters Vertical: Design & Build Brief

> Vertical #1 of the larger educational app. Goal: take a ~3-year-old from
> "sees a letter" to "sounds it out and builds simple words," using real phonics
> pedagogy — not a generic alphabet toy. Build English first; structured so a
> Portuguese layer can be added later. Reuses the existing app's architecture,
> theme system, privacy model, and tooling.

---

## 0. Scope of this vertical

Three learning stages, in order. Ship each before starting the next.

1. **Letter recognition + sound** — see a letter, hear its *sound*, tap it.
2. **Sound matching** — "which letter says /sss/?" — tap the right one.
3. **Word building (blending)** — combine letters into simple words (sat, pin).

Out of scope for this vertical (later): uppercase/lowercase pairing beyond basics,
letter *names* as a formal lesson, digraphs (ch, sh), tracing/handwriting,
sentences. And Portuguese — that's a later layer across all verticals.

---

## 1. The pedagogy (evidence base — follow it exactly)

- **Sounds before names.** Teach the phoneme (/s/, /a/, /t/) first. Letter names
  ("ess," "ay") come much later, once blending is solid. (Ehri et al. 2001;
  National Reading Panel — systematic phonics beats incidental/whole-language,
  and the earlier the better.)
- **SATPIN order, not alphabetical.** Introduce letters as **s, a, t, p, i, n**,
  then m, d, g, o, c, k, then the rest. This unlocks real words almost
  immediately, which is the confidence engine.
- **Start with continuous sounds** (/s/, /m/, /n/, /f/) — they can be held and
  are easier to blend than "stop" sounds (/t/, /p/). SATPIN front-loads these.
- **Blend into CVC words** (consonant-vowel-consonant: sat, pin, tap, nap) as the
  first word milestone — the "letters make words" payoff.
- **Accuracy before speed.** No timers, no racing. Mastery of a sound before the
  next is introduced.
- **Systematic and explicit** — a defined sequence, not random letters.

---

## 2. The learning progression & mechanics

### Stage A — Recognition + sound (the foundation)
- A single large, clean letter appears (Fredoka, high contrast, unmistakable).
- Tapping it plays its **sound** ("/sss/") with a warm voice, and a friendly
  visual reaction. A picture cue whose name starts with that sound can reinforce
  it (s → snake), but the *sound* is the star, not the picture.
- Introduce **one new letter at a time**, in SATPIN order. Revisit learned
  letters before adding a new one.
- No quiz here — pure exposure and association. This is the "no-pressure" entry.

### Stage B — Sound matching (light challenge)
- The app says a sound ("tap the letter that says /sss/").
- 2–3 letters shown (only ones already learned); child taps.
- **Correct:** warm confirmation, the letter celebrates.
- **"Not yet":** NO failure sound, NO score. The chosen letter gently says its
  own sound ("that's /t/…"), then the app re-invites toward the target. Always
  end on success. (See §4 — this is the one real design tension.)

### Stage C — Word building (the milestone)
- Show a simple CVC word slot with a picture (e.g. a cat → _ _ _ for "cat"... but
  start inside SATPIN: "sat," "pin," "tap," "nap").
- The letters needed are offered; child places them left to right.
- As each letter lands, its **sound** plays; when the word is complete, the app
  **blends it slowly then says it whole** ("/sss/-/a/-/t/… sat!"). This is the
  single most important audio moment in the vertical — it's where letters become
  reading.
- Start with 2-sound then 3-sound (CVC) words, all within learned letters.

---

## 3. Letter & word sequence (the curriculum spine)

- **Set 1:** s, a, t, p, i, n → words: at, sat, pat, tap, tip, pin, pan, nap, sip
- **Set 2:** m, d, g, o, c, k → words: mad, dog, cat, cot, kid, mop
- **Set 3+:** ck, e, u, r, h, b, f, l → widening CVC bank
- Keep this list in a data file so the sequence is editable and, later,
  swappable per language.

---

## 4. The one hard design tension (read this before building)

The rest of the app has a strict **no-fail-state** rule. Counting has no wrong
answer. **Phonics does** — sound-matching and word-building have a correct target.

Resolve it without breaking the app's soul:
- **No punishment, ever** — no buzzer, no red X, no score, no "wrong."
- A non-target tap is treated as *exploration*: the tapped letter simply says its
  own sound, then the app warmly re-invites toward the goal.
- **Always end on success** — guide until the child gets it, then celebrate.
- Think "supportive tutor," not "test." This keeps the gentleness while still
  teaching a skill that has right answers.

---

## 5. The critical dependency: real phoneme audio

Phonics lives or dies on **accurate sound**. This is the biggest new requirement.

- **TTS (expo-speech) is NOT adequate here.** Ask a TTS engine for "s" and it
  says the *name* "ess," or mangles isolated phonemes. Pure phonemes ("/sss/",
  "/a/") must be **recorded clips**, not synthesized.
- Plan for a small library of recorded audio: each letter's pure sound, each
  target word spoken whole, and the slow blend. **Your own or Vivian's voice is
  ideal** — accurate, warm, and a bonus for Emma.
- Alternatively, source a clean CC0/commercially-licensed phoneme set, but verify
  the pronunciations are true isolated phonemes, not letter names.
- Everything stays **bundled and offline** — same collect-nothing, airplane-mode
  guarantee as the rest of the app.

This dependency is why Stage A can't be "done" until the phoneme clips exist.

---

## 6. Reuse vs. new

**Reuse from the counting app (don't rebuild):**
- Theme tokens, Fredoka font, Reanimated spring motion, parent gate, settings,
  the collect-nothing/offline architecture, the audio+haptics hook pattern.
- The ocean world can remain the app's home so the verticals feel unified — but
  the **letter must be the clear hero**: big, legible, uncluttered. Decoration
  supports, never competes with, the letterform.

**New for letters:**
- A phoneme/word audio layer (§5).
- A letters data model (sequence, sounds, words, picture cues).
- Three new activity screens (Stages A/B/C).
- The gentle "supportive tutor" feedback pattern (§4).

---

## 7. Bilingual-ready structure (build English, don't hardcode it)

Portuguese is a later layer, but build so it drops in cleanly:
- **Phonics does NOT translate.** Portuguese letter-sound correspondences differ
  (different vowel sounds, ã/õ nasals, lh, nh, different SATPIN-equivalent order).
  A PT version is a *different curriculum*, not a translated string list.
- So: put all sounds, words, picture cues, and the letter sequence in a
  **language-keyed data structure** from day one (e.g. `content.en.ts`), even
  though only English exists now. When PT comes, it's a new `content.pt.ts` with
  its own sequence and its own recorded audio — plugged into the same engine.
- Do not bake English assumptions (letter order, "sounds like") into the engine
  logic. Engine = language-agnostic; data = per-language.

---

## 8. Architecture

```
/components/letters
  LetterTile          one large, legible, tappable letter (sound on tap)
  SoundMatch          Stage B: hear a sound, pick the letter
  WordBuilder         Stage C: place letters, hear the blend
  LetterCelebration   warm, calm success moment (reuse celebration patterns)
/hooks
  useLetters          progression state: current set, mastery, stage (pure/tested)
  usePhonics          plays phoneme clips, blends, words (wraps audio layer)
/constants
  letters.en.ts       SATPIN sequence, sounds, CVC words, cues (language-keyed)
/assets/audio/phonics/en
  s.mp3 a.mp3 ...      recorded pure phonemes
  words/ sat.mp3 ...   recorded whole words
```

Keep `useLetters` pure and tested (like `useCounting`) — mastery tracking and
sequence logic are the "real engineering" core and the interview story.

---

## 9. Staged Claude Code plan (each stage ships)

**Stage L0 — Foundation**
> Add a letters data model in constants/letters.en.ts (SATPIN sequence, per-letter
> sound + picture cue, CVC word list), language-keyed for future PT. Add a
> usePhonics hook that plays bundled recorded phoneme clips from
> assets/audio/phonics/en (placeholder clips for now), NOT TTS. Add a "Letters"
> entry alongside the existing subjects. Reuse theme, fonts, privacy model. tsc +
> tests.

**Stage L1 — Recognition + sound (Stage A)**
> Build LetterTile and a recognition screen: one large Fredoka letter, tap plays
> its recorded sound + a gentle Reanimated reaction and a picture cue. Introduce
> letters one at a time in SATPIN order, revisiting learned ones. No quiz, no fail.

**Stage L2 — Sound matching (Stage B)**
> Build SoundMatch: app plays a target sound, shows 2–3 learned letters, child
> taps. Correct = warm celebration; non-target = that letter says its own sound,
> then re-invite — NO fail sound, NO score, always end on success (per brief §4).

**Stage L3 — Word building (Stage C)**
> Build WordBuilder: a CVC slot with a picture; child places letters left to
> right; each letter sounds as placed; on completion, play the slow blend then the
> whole word. Start with SATPIN CVC words. This is the core reading moment.

**Stage L4 — Expand & track**
> Add Set 2 (m,d,g,o,c,k) and a simple mastery/progress model in useLetters so the
> sequence advances as letters are learned. Keep it parent-visible, child-invisible.

**Later (separate):** Portuguese layer, more sets, tracing.

---

## 10. Definition of done (this vertical)

- [ ] Sounds taught before names; SATPIN order; continuous sounds first.
- [ ] Recorded phoneme + word audio (not TTS); bundled, offline.
- [ ] All three stages (recognition, matching, word-building) playable.
- [ ] No fail state — non-target taps handled as gentle exploration.
- [ ] Content is language-keyed so PT can be added without engine changes.
- [ ] Reuses theme, privacy, offline guarantees; letter is always the visual hero.
- [ ] useLetters is pure and tested.
- [ ] Tested on Emma — does she connect a letter to its sound, and light up when a
      word blends?
