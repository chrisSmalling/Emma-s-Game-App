# Phonics audio (Letters vertical)

Every clip in `en/sounds/` and `en/words/` is real, distinct audio generated
locally by **eSpeak NG** — not a recording, not runtime TTS, not a shared
placeholder tone. See "Why eSpeak NG, and why this doesn't break the privacy
contract" below before assuming this is the same thing as the `expo-speech`
TTS the brief rules out.

## Regenerating audio

```
node scripts/generate-phonics-audio.mjs            # everything
node scripts/generate-phonics-audio.mjs t p k      # just these letters
node scripts/generate-phonics-audio.mjs cat dog    # just these words
```

Requires `espeak-ng` on PATH (`brew install espeak-ng` on macOS,
`apt-get install espeak-ng` on Debian/Ubuntu) — a one-time local dev tool,
never a runtime dependency of the app. Regenerating one key never touches
any other file, so fixing a single bad sound is cheap — see "Audition
checklist" below for the workflow.

## Why eSpeak NG, and why this doesn't break the privacy contract

eSpeak NG runs **once, locally, at build/dev time** to render static `.wav`
files that get committed and bundled as ordinary assets. `scripts/` is never
imported by any app code, and `espeak-ng` is not an npm dependency of the
app — it doesn't appear anywhere in the bundle. The running app still never
does TTS, never calls a synthesis engine, never hits a network: it plays a
bundled audio file exactly the way it would play a real recording. This is
categorically different from the `expo-speech` TTS the brief rules out for
phonemes (LETTERS-VERTICAL-BRIEF.md §5) — that TTS runs *at runtime*, on
arbitrary text, and (per that same section) mispronounces isolated phonemes
by defaulting to letter *names* ("ess" instead of "/s/"). eSpeak NG's
phoneme-bracket input (`[[...]]`, see below) sidesteps that specific failure
mode by rendering the phoneme directly instead of translating spelled text.

It's still synthesized speech, not a human voice — see "Known trouble
spots" below for exactly where that shows, and the brief's own preference
for **a parent's recorded voice** as the eventual real answer. This is a
meaningfully better placeholder than silence or a blip tone, not a
replacement for that.

## How each letter sound was built

eSpeak NG's phoneme-bracket input (`espeak-ng "[[<spec>]]"`) bypasses
text-to-speech translation and renders a named phoneme directly — this is
what keeps `t` from being spoken as the letter name "tee". Every spec below
was verified against its target IPA with `espeak-ng --ipa "[[<spec>]]"`.

| Letter | Target sound | Spec used | `[[<spec>]]` → IPA | Notes |
|---|---|---|---|---|
| s | /s/ | `s:` | sː | `:` lengthens for a held "sss" |
| a | /æ/ | `a?` | ˈæʔ | trailing `?` — see "short vowels" below |
| t | /t/ | `t` | t | clean burst, no fix needed |
| p | /p/ | `p` | p | clean burst, no fix needed |
| i | /ɪ/ | `I?` | ˈɪʔ | capital `I`, not lowercase — see below |
| n | /n/ | `nnnnn` | nnnnn | repeated — see "nasals/liquid" below |
| m | /m/ | `mmm` | mmm | repeated — see "nasals/liquid" below |
| d | /d/ | `d?` | dʔ | trailing `?` — see "voiced stops" below |
| g | /ɡ/ | `g?` | ɡʔ | trailing `?` — see "voiced stops" below |
| o | /ɒ/ (US: /ɑ/) | `0?` | ˈɑːʔ | digit `0`, not letter `o` — see below |
| c | /k/ | `k` | k | "c" isn't a valid phoneme id; same target as k |
| k | /k/ | `k` | k | clean burst, no fix needed |
| ck | /k/ | `k` | k | digraph, same target as k |
| e | /ɛ/ | `E?` | ˈɛʔ | capital `E`, not lowercase — see below |
| u | /ʌ/ | `V?` | ˈʌʔ | `V`, not letter `u` — see below |
| r | /ɹ/ | `r@` (trimmed) | ɹˈə → trimmed | see "r" below — the one real problem case |
| h | /h/ | `h` | h | clean, breathy, no fix needed |
| b | /b/ | `b?` | bʔ | trailing `?` — see "voiced stops" below |
| f | /f/ | `f:` | fː | `:` lengthens for a held "fff" |
| l | /l/ | `lllll` | lllll | repeated — see "nasals/liquid" below |

Words (`en/words/<word>.wav`) use plain text input (`espeak-ng "cat"`) at a
slightly slower rate than default — we want the natural whole-word blend
here, not an isolated phoneme, for the Stage C "…sat!" payoff.

## Known trouble spots (audition these first)

**Voiced stops (b, d, g).** In true isolation these are almost silent — a
voiced stop's acoustic energy comes almost entirely from its release into a
following sound, and eSpeak renders literal digital silence for `[[d]]`,
`[[b]]`, `[[g]]` alone (verified: max amplitude 0 across the whole clip). A
trailing glottal stop (`?`) gives them something to release into, which
makes them audible without adding a full vowel. Listen for: audible but
clean, not a "duh"/"buh"/"guh".

**Short vowels (a, e, i, o, u).** eSpeak lengthens and *changes* these when
they're phrase-final with nothing following — phrase-final lengthening
pushes a short/checked vowel toward a different, longer realization
entirely (confirmed via `--ipa`: bare `[[i]]` and `[[o]]` render as the
*wrong* vowel, not just a longer version of the right one). The same
trailing glottal stop forces the correct short realization instead.
Capitalization also matters and is easy to get wrong by hand: lowercase
`e`/`i`/`u` select different (long/tense) vowels; `E`/`I`/`V` select the
short ones we want. Listen for: cat/bed/pin/dog/cup, not letter names or
long vowels.

**Nasals and the liquid (m, n, l).** Default duration for these alone is
very short (40-60ms) — too brief to read as a held "mmm". `:` (which works
for the fricatives s/f) has no effect on nasals/liquid; repeating the
phoneme itself does. `n` responds to repetition less than `m`/`l` do
(diminishing returns past ~5 repeats), so it's the shortest-held of the
three even after this fix — worth a listen.

**r — the one real problem, not just a tuning knob.** eSpeak's /r/
approximant is **silent in total isolation** — no burst, no voicing; its
entire acoustic signature is the formant transition into a following vowel,
so no glottal stop or length modifier makes it audible alone (all
confirmed: `[[r]]`, `[[r?]]`, `[[r:]]` are all literal silence). The only
audible option is `r` + a schwa (`[[r@]]`), which reads as "ruh" — exactly
the trailing-schwa problem this whole approach is supposed to avoid.
`scripts/generate-phonics-audio.mjs` trims that render down to the first
260ms with a 30ms fade-out, cutting off before the schwa's steady state to
keep mostly the r-onset and the start of the vocalic transition. It's a
genuine compromise, not a confident answer — **r is the single most likely
candidate in this whole set to need a real recording instead of a synth
fix**, since the underlying acoustic content it needs (a vowel to transition
into) is exactly what we're trying not to add.

## Audition workflow

Listen to `en/sounds/*.wav` and `en/words/*.wav` on-device. For anything
that needs adjusting, say which letter/word and what's wrong — most fixes
are a one-line change to `LETTER_PHONEME_SPEC` in
`scripts/generate-phonics-audio.mjs` (see the table above for what's
currently used) followed by re-running the script for just that key. Word
clips can be re-recorded with a different rate/pronunciation the same way.

**Still true regardless of tuning:** this is synthesized speech, not a human
voice. Per the brief, a parent's own recorded voice remains the intended
real answer — treat this pipeline as a large, honest step up from silence,
not the finish line.
