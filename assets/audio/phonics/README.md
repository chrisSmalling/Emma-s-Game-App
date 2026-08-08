# Phonics audio (Letters vertical)

Every letter sound and word clip currently points at the same file:
`en/_placeholder.wav` — a short, deliberately non-speech "blip" tone.

This is intentional, not an oversight. Per LETTERS-VERTICAL-BRIEF.md §5, TTS
mispronounces isolated phonemes (asks for "s", gets the letter *name* "ess" or
a mangled sound), so synthesizing fake phoneme audio would be actively
misleading rather than just incomplete. The placeholder is a generic UI blip
specifically so nobody mistakes it for an attempted pronunciation.

**This vertical's Stage A cannot be considered done until these are replaced**
with real recordings — see hooks/usePhonics.ts for the full key list. Needed,
per letter and per word:

- `en/<letterId>.wav` — the letter's pure phoneme, held briefly where it's a
  continuant ("/sss/", "/mmm/") — see `continuous` in constants/letters.en.ts.
- `en/words/<word>.wav` — the word spoken naturally, whole.

A parent's own recorded voice is ideal here (per the brief) — warm, accurate,
and meaningful to the child. Swap the `require()` paths in
`hooks/usePhonics.ts` once real clips exist; the engine doesn't change.
