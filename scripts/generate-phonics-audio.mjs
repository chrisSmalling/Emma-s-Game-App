#!/usr/bin/env node
// Local, offline, build-time audio generation for the Letters vertical —
// NEVER imported by app code, NEVER run at runtime. Run this once (or per
// key, whenever a phoneme choice needs tuning) on a dev machine with
// eSpeak NG installed (`brew install espeak-ng` on macOS, `apt-get install
// espeak-ng` on Debian/Ubuntu), then commit the generated .wav files —
// the running app only ever plays the static files this script produces.
// See assets/audio/phonics/README.md for the full rationale (not TTS at
// runtime, not a recording — see there for what this trades off).
//
// Usage:
//   node scripts/generate-phonics-audio.mjs                # regenerate everything
//   node scripts/generate-phonics-audio.mjs t p k           # just these letters
//   node scripts/generate-phonics-audio.mjs cat dog         # just these words
//   node scripts/generate-phonics-audio.mjs t cat           # mix of both
//
// Idempotent and single-key friendly: regenerating one key never touches
// any other file, so tuning a single bad sound is cheap.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SOUNDS_DIR = path.join(REPO_ROOT, 'assets/audio/phonics/en/sounds');
const WORDS_DIR = path.join(REPO_ROOT, 'assets/audio/phonics/en/words');

const VOICE = 'en-us';
// Slower than eSpeak's default (175) for clarity — letters slightly slower
// than words, since an isolated phoneme has no surrounding-word context to
// help a child parse it.
const LETTER_RATE = 130;
const WORD_RATE = 145;

// eSpeak NG phoneme-bracket input (`[[...]]`) bypasses text-to-speech
// translation entirely and renders the named phoneme(s) directly — this is
// what keeps "t" from being spoken as the letter name "tee". Each value
// here is the phoneme spec placed inside the brackets; every choice was
// verified with `espeak-ng --ipa "[[<spec>]]"` against the target IPA
// (see assets/audio/phonics/README.md for the full verification notes and
// why each non-obvious one needed what it needed):
//
// - Stops (t, p, k, c, ck) render as a clean, brief burst with no schwa by
//   default — phoneme-bracket input doesn't add one the way spelling out
//   the letter name would.
// - Voiced stops (b, d, g) are near-silent in true isolation (almost no
//   acoustic energy without a release into a following sound) — a trailing
//   glottal stop (`?`) gives them something to release into and makes them
//   audible without adding a vowel.
// - Checked/short vowels (a, e, i, o, u) get *lengthened and changed* by
//   eSpeak when phrase-final with nothing following (phrase-final
//   lengthening pushes them toward a different, longer vowel) — the same
//   trailing glottal stop forces the correct short realization instead.
//   Capitalization matters: E/I/V select the short vowel; lowercase e/i/u
//   select different (long/tense) vowels entirely.
// - Continuants (s, f: fricatives; m, n, l: nasals/liquid) default to a
//   very brief 40-140ms burst — too short to read as a held "sss"/"mmm".
//   `:` lengthens fricatives; nasals/liquid don't respond to `:`, so the
//   phoneme is simply repeated to hold it longer.
// - r is a genuine eSpeak limitation: the /r/ approximant is *silent* in
//   total isolation (no burst, no voicing — its acoustic signature is
//   almost entirely the formant transition into a following vowel), and no
//   combination of glottal stop / length modifier makes it audible alone.
//   The least-bad option is r + a schwa (`@`), which IS audible but reads
//   as "ruh" — POST_PROCESS trims that down to just the onset + the
//   beginning of the transition, cutting off before the schwa's steady
//   state, with a short fade to avoid a click. Flagged in the audition
//   notes as the one letter most likely to need a real recording.
const LETTER_PHONEME_SPEC = {
  s: 's:',
  a: 'a?',
  t: 't',
  p: 'p',
  i: 'I?',
  n: 'nnnnn',
  m: 'mmm',
  d: 'd?',
  g: 'g?',
  o: '0?',
  c: 'k', // "c" is not itself a valid eSpeak phoneme id; c's target sound is /k/, same as k.
  k: 'k',
  ck: 'k', // digraph, same target /k/
  e: 'E?',
  u: 'V?',
  r: 'r@', // special-cased below — post-processed (trimmed) after rendering
  h: 'h',
  b: 'b?',
  f: 'f:',
  l: 'lllll',
};

// A trailing schwa is the one unavoidable way to make eSpeak's /r/ audible
// at all in isolation — trim it down to just the r-onset + the start of the
// vocalic transition (the part that actually carries the "r" character),
// with a short fade so the cut isn't an audible click.
const R_TRIM_MAX_MS = 260;
const R_TRIM_FADE_MS = 30;

const WORDS = [
  'at', 'sat', 'pat', 'tap', 'tip', 'pin', 'pan', 'nap', 'sip',
  'mad', 'dog', 'cat', 'cot', 'kid', 'mop',
];

function assertEspeakAvailable() {
  try {
    execFileSync('espeak-ng', ['--version'], { stdio: 'pipe' });
  } catch {
    console.error(
      'espeak-ng not found on PATH. Install it first:\n' +
        '  macOS:          brew install espeak-ng\n' +
        '  Debian/Ubuntu:  sudo apt-get install espeak-ng\n' +
        'This is a one-time local dev tool — it is never run by the app itself.'
    );
    process.exit(1);
  }
}

function synth(text, rate, outPath) {
  execFileSync('espeak-ng', ['-v', VOICE, '-s', String(rate), text, '-w', outPath], { stdio: 'pipe' });
}

// Minimal WAV trim + linear fade-out, PCM16 mono only (all we ever produce
// here) — no ffmpeg dependency, just the handful of bytes a WAV header is.
function trimAndFadeWav(filePath, maxMs, fadeMs) {
  const buf = readFileSync(filePath);
  const dataOffset = buf.indexOf(Buffer.from('data')) + 8;
  const sampleRate = buf.readUInt32LE(24);
  const bytesPerSample = 2; // PCM16
  const maxSamples = Math.floor((maxMs / 1000) * sampleRate);
  const fadeSamples = Math.floor((fadeMs / 1000) * sampleRate);

  const available = (buf.length - dataOffset) / bytesPerSample;
  const keepSamples = Math.min(maxSamples, available);
  const pcm = Buffer.from(buf.subarray(dataOffset, dataOffset + keepSamples * bytesPerSample));

  const fadeStart = Math.max(0, keepSamples - fadeSamples);
  for (let i = fadeStart; i < keepSamples; i++) {
    const t = (i - fadeStart) / (keepSamples - fadeStart || 1);
    const gain = 1 - t;
    const sample = pcm.readInt16LE(i * 2);
    pcm.writeInt16LE(Math.round(sample * gain), i * 2);
  }

  const header = Buffer.from(buf.subarray(0, dataOffset));
  const out = Buffer.concat([header, pcm]);
  out.writeUInt32LE(out.length - 8, 4); // RIFF chunk size
  out.writeUInt32LE(pcm.length, dataOffset - 4); // data chunk size
  writeFileSync(filePath, out);
}

function generateLetter(id) {
  const spec = LETTER_PHONEME_SPEC[id];
  if (!spec) throw new Error(`No phoneme spec for letter "${id}"`);
  mkdirSync(SOUNDS_DIR, { recursive: true });
  const outPath = path.join(SOUNDS_DIR, `${id}.wav`);
  synth(`[[${spec}]]`, LETTER_RATE, outPath);
  if (id === 'r') trimAndFadeWav(outPath, R_TRIM_MAX_MS, R_TRIM_FADE_MS);
  console.log(`  letter ${id.padEnd(3)} <- [[${spec}]]${id === 'r' ? ' (trimmed)' : ''}`);
}

function generateWord(word) {
  mkdirSync(WORDS_DIR, { recursive: true });
  const outPath = path.join(WORDS_DIR, `${word}.wav`);
  synth(word, WORD_RATE, outPath);
  console.log(`  word   ${word}`);
}

function main() {
  assertEspeakAvailable();

  const requested = process.argv.slice(2);
  const letterIds = Object.keys(LETTER_PHONEME_SPEC);
  const runAll = requested.length === 0;

  const lettersToRun = runAll ? letterIds : requested.filter(t => letterIds.includes(t));
  const wordsToRun = runAll ? WORDS : requested.filter(t => WORDS.includes(t));

  if (!runAll) {
    const unknown = requested.filter(t => !letterIds.includes(t) && !WORDS.includes(t));
    if (unknown.length > 0) {
      console.error(`Unknown letter/word id(s): ${unknown.join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`Generating ${lettersToRun.length} letter sound(s)...`);
  lettersToRun.forEach(generateLetter);

  console.log(`Generating ${wordsToRun.length} word clip(s)...`);
  wordsToRun.forEach(generateWord);

  console.log('Done.');
}

main();
