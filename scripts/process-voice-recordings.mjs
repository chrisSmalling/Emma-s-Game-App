#!/usr/bin/env node
// One-time (re-runnable) local processing of REAL voice recordings into the
// Letters vertical's phonics audio assets — replacing the eSpeak-generated
// placeholders (scripts/generate-phonics-audio.mjs, kept as-is for any
// future letter/word that doesn't have a recording yet).
//
// NEVER imported by app code, NEVER run at runtime. Requires ffmpeg on PATH
// (`brew install ffmpeg` on macOS, `apt-get install ffmpeg` on
// Debian/Ubuntu) — a one-time local dev tool, same posture as eSpeak NG.
//
// Input (not committed — see recordings/README if you add one): iPhone
// Voice Memos takes, each a single recording of multiple items spoken once,
// separated by ~2s silent gaps, in a fixed known order:
//   recordings/letters.m4a — 20 letter SOUNDS, order: LETTER_ORDER below
//   recordings/words.m4a   — 15 WORDS, order: WORD_ORDER below
//   recordings/blend.m4a   — 6 blend demos (sounds-then-word), order: BLEND_ORDER below
//
// Output: overwrites assets/audio/phonics/en/sounds/<letter>.wav and
// assets/audio/phonics/en/words/<word>.wav, and writes
// assets/audio/phonics/en/words/<word>_blend.wav for the 6 blend demos —
// same PCM16 mono WAV format the eSpeak placeholders already used, so
// usePhonics.ts needs no path changes.
//
// Usage: node scripts/process-voice-recordings.mjs

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.join(REPO_ROOT, 'recordings');
const SOUNDS_DIR = path.join(REPO_ROOT, 'assets/audio/phonics/en/sounds');
const WORDS_DIR = path.join(REPO_ROOT, 'assets/audio/phonics/en/words');

const OUTPUT_SAMPLE_RATE = 44100;

const LETTER_ORDER = [
  's', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o',
  'c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'l',
];
const WORD_ORDER = [
  'at', 'sat', 'pat', 'tap', 'tip', 'pin', 'pan', 'nap', 'sip',
  'mad', 'dog', 'cat', 'cot', 'kid', 'mop',
];
const BLEND_ORDER = ['sat', 'pin', 'tap', 'nap', 'dog', 'cat'];

// Silence-detection tuning: these are isolated single items with genuine
// silence between them (not natural speech pauses), so the threshold can be
// fairly generous without risking a false mid-word split. If a take's
// segment count comes out wrong, this is the first thing to adjust — a
// louder recording (typically fine, from the takes not from silence)
// suggests raising SILENCE_NOISE_FLOOR_DB (less negative); background noise
// preventing detection of a real gap suggests lowering it (more negative).
const SILENCE_NOISE_FLOOR_DB = -35;
const SILENCE_MIN_DURATION_SEC = 0.6;
// Segments shorter than this are silence-detection artifacts (a sliver of
// room tone at the very start/end of the take), not a real spoken item.
const MIN_SEGMENT_DURATION_SEC = 0.15;

const TAKES = [
  { name: 'letters', file: 'letters.m4a', order: LETTER_ORDER, label: 'letter sound' },
  { name: 'words', file: 'words.m4a', order: WORD_ORDER, label: 'word' },
  { name: 'blend', file: 'blend.m4a', order: BLEND_ORDER, label: 'blend demo' },
];

function assertFfmpegAvailable() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
    execFileSync('ffprobe', ['-version'], { stdio: 'pipe' });
  } catch {
    console.error(
      'ffmpeg/ffprobe not found on PATH. Install first:\n' +
        '  macOS:          brew install ffmpeg\n' +
        '  Debian/Ubuntu:  sudo apt-get install ffmpeg\n' +
        'This is a one-time local dev tool — it is never run by the app itself.'
    );
    process.exit(1);
  }
}

function dbToLinear(db) {
  return Math.pow(10, db / 20);
}

function getDuration(filePath) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
    { encoding: 'utf8' }
  );
  return parseFloat(out.trim());
}

// Runs ffmpeg's silencedetect over the whole take and returns the silent
// [start, end] intervals it found (in seconds).
function detectSilenceIntervals(filePath, totalDuration) {
  const result = spawnSync('ffmpeg', [
    '-i', filePath,
    '-af', `silencedetect=noise=${SILENCE_NOISE_FLOOR_DB}dB:d=${SILENCE_MIN_DURATION_SEC}`,
    '-f', 'null', '-',
  ], { encoding: 'utf8' });
  const stderr = result.stderr || '';

  const starts = [...stderr.matchAll(/silence_start:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
  const ends = [...stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));

  const intervals = [];
  for (let i = 0; i < starts.length; i++) {
    // A silence_start with no matching silence_end means the take ends
    // while still silent (trailing silence) — close it at the take's end.
    intervals.push({ start: starts[i], end: ends[i] ?? totalDuration });
  }
  return intervals;
}

// The spoken segments are the complement of the silence intervals.
function computeSpokenSegments(silenceIntervals, totalDuration) {
  const segments = [];
  let cursor = 0;
  for (const { start, end } of silenceIntervals) {
    if (start > cursor) segments.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < totalDuration) segments.push({ start: cursor, end: totalDuration });
  return segments.filter(seg => seg.end - seg.start >= MIN_SEGMENT_DURATION_SEC);
}

// Extracts one segment, trims any residual edge silence within it,
// lightly normalizes loudness, and standardizes format/sample rate.
function extractSegment(inputPath, segment, outPath) {
  const thresh = dbToLinear(SILENCE_NOISE_FLOOR_DB);
  const filters = [
    `silenceremove=start_periods=1:start_duration=0:start_threshold=${thresh}:detection=peak`,
    `silenceremove=stop_periods=1:stop_duration=0:stop_threshold=${thresh}:detection=peak`,
    'loudnorm=I=-18:TP=-1.5:LRA=11',
  ].join(',');

  execFileSync('ffmpeg', [
    '-y',
    '-i', inputPath,
    '-ss', String(segment.start),
    '-t', String(segment.end - segment.start),
    '-af', filters,
    '-ar', String(OUTPUT_SAMPLE_RATE),
    '-ac', '1',
    '-c:a', 'pcm_s16le',
    outPath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

function analyzeTake(take) {
  const filePath = path.join(RECORDINGS_DIR, take.file);
  if (!existsSync(filePath)) {
    return { take, error: `recordings/${take.file} not found` };
  }

  const totalDuration = getDuration(filePath);
  const silenceIntervals = detectSilenceIntervals(filePath, totalDuration);
  const segments = computeSpokenSegments(silenceIntervals, totalDuration);

  return { take, filePath, totalDuration, segments };
}

function formatSegments(segments) {
  return segments
    .map((seg, i) => `    [${i}] ${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s (${(seg.end - seg.start).toFixed(2)}s)`)
    .join('\n');
}

function main() {
  assertFfmpegAvailable();

  if (!existsSync(RECORDINGS_DIR)) {
    console.error(
      `recordings/ not found at ${RECORDINGS_DIR}.\n` +
        'Expected recordings/letters.m4a, recordings/words.m4a, recordings/blend.m4a.\n' +
        'Nothing was processed — no output files were touched.'
    );
    process.exit(1);
  }

  console.log('Analyzing takes...\n');
  const analyses = TAKES.map(analyzeTake);

  let anyProblem = false;
  for (const analysis of analyses) {
    const { take } = analysis;
    if (analysis.error) {
      console.error(`✗ ${take.file}: ${analysis.error}`);
      anyProblem = true;
      continue;
    }
    const found = analysis.segments.length;
    const expected = take.order.length;
    const ok = found === expected;
    console.log(`${ok ? '✓' : '✗'} ${take.file}: found ${found} segment(s), expected ${expected} ${take.label}(s)`);
    console.log(formatSegments(analysis.segments));
    console.log('');
    if (!ok) anyProblem = true;
  }

  if (anyProblem) {
    console.error(
      'One or more takes did not yield the expected segment count — stopping\n' +
        'WITHOUT writing any output files (a wrong count means every item after\n' +
        'the error would be mislabeled). Options:\n' +
        '  - Re-record the take so every gap is a clean ~2s silence.\n' +
        `  - Adjust SILENCE_NOISE_FLOOR_DB (currently ${SILENCE_NOISE_FLOOR_DB}dB) or\n` +
        `    SILENCE_MIN_DURATION_SEC (currently ${SILENCE_MIN_DURATION_SEC}s) at the top of this\n` +
        '    script and re-run — the segment list above shows exactly where the\n' +
        '    split went wrong (a suspiciously short/long segment, or two segments\n' +
        '    that should have been one).'
    );
    process.exit(1);
  }

  console.log('All three takes matched their expected counts. Writing output files...\n');

  mkdirSync(SOUNDS_DIR, { recursive: true });
  mkdirSync(WORDS_DIR, { recursive: true });

  const letters = analyses.find(a => a.take.name === 'letters');
  const words = analyses.find(a => a.take.name === 'words');
  const blend = analyses.find(a => a.take.name === 'blend');

  const written = [];

  LETTER_ORDER.forEach((id, i) => {
    const outPath = path.join(SOUNDS_DIR, `${id}.wav`);
    extractSegment(letters.filePath, letters.segments[i], outPath);
    written.push(outPath);
  });

  WORD_ORDER.forEach((word, i) => {
    const outPath = path.join(WORDS_DIR, `${word}.wav`);
    extractSegment(words.filePath, words.segments[i], outPath);
    written.push(outPath);
  });

  BLEND_ORDER.forEach((word, i) => {
    const outPath = path.join(WORDS_DIR, `${word}_blend.wav`);
    extractSegment(blend.filePath, blend.segments[i], outPath);
    written.push(outPath);
  });

  console.log(`Wrote ${written.length} files:`);
  written.forEach(p => console.log(`  ${path.relative(REPO_ROOT, p)}`));
}

main();
