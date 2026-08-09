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
// Voice Memos takes, each a single recording of multiple items spoken once
// in a fixed known order, with pauses between items:
//   recordings/letters.m4a — 20 letter SOUNDS, order: LETTER_ORDER below
//   recordings/words.m4a   — 15 WORDS, order: WORD_ORDER below
//   recordings/blend.m4a   — 6 blend demos (each itself multi-part: the
//                            sounds spoken slowly, then the whole word, e.g.
//                            "sss... a... t... sat!"), order: BLEND_ORDER
//
// Splitting strategy: real recordings don't have a clean, uniform pause
// length — the silence between two different items and the incidental
// breath/mouth-noise pauses *within* one item overlap in duration. So
// instead of "any pause over X seconds is a boundary", this finds every
// fine-grained pause in a take and keeps only the (expectedCount - 1)
// *longest* ones as real item boundaries — everything else (including,
// deliberately, the internal pauses inside a blend demo's "sound... sound...
// word" cadence) stays fused into one clip. This only works if the speaker
// paused at least a little longer between items than within one — true for
// words/blend in practice, NOT reliably true for letters (see the warning
// the script prints if a letter's clip looks like it merged multiple
// letters — those need a manual re-listen or a re-recording).
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

const NOISE_FLOOR_DB = -35;
// Low threshold so we catch every real pause, including short ones inside
// a single item — the boundary-selection step below is what decides which
// pauses actually separate items.
const FINE_SILENCE_MIN_DURATION_SEC = 0.2;
// Fine "segments" shorter than this are mouth-click/pop artifacts, not real
// spoken content — dropped before boundary selection so they don't distort
// the surrounding pause durations (removing a tiny fake segment correctly
// merges the silence on either side of it into one real pause).
const TINY_SEGMENT_DROP_SEC = 0.15;
// A group's duration is flagged as suspicious relative to the take's own
// median group duration — a low-confidence hint to spot-check, not a hard
// error (the algorithm always produces exactly the expected count, so a
// wrong split shows up as a duration outlier, not a count mismatch).
const OUTLIER_HIGH_RATIO = 1.8;
const OUTLIER_LOW_RATIO = 0.35;

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
    '-af', `silencedetect=noise=${NOISE_FLOOR_DB}dB:d=${FINE_SILENCE_MIN_DURATION_SEC}`,
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

// The fine spoken segments are the complement of the silence intervals,
// with mouth-click/pop artifacts dropped (see TINY_SEGMENT_DROP_SEC).
function computeFineSegments(silenceIntervals, totalDuration) {
  const segments = [];
  let cursor = 0;
  for (const { start, end } of silenceIntervals) {
    if (start > cursor) segments.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < totalDuration) segments.push({ start: cursor, end: totalDuration });
  return segments.filter(seg => seg.end - seg.start >= TINY_SEGMENT_DROP_SEC);
}

// Groups fine segments into exactly `expectedCount` items by keeping only
// the (expectedCount - 1) longest pauses between them as real boundaries.
// Everything fused within a group (including shorter internal pauses)
// becomes one continuous output clip.
function groupByTopGaps(fineSegments, expectedCount) {
  if (fineSegments.length < expectedCount) return null;

  const gaps = [];
  for (let i = 0; i < fineSegments.length - 1; i++) {
    gaps.push({ index: i, duration: fineSegments[i + 1].start - fineSegments[i].end });
  }
  const boundaryIndices = new Set(
    [...gaps].sort((a, b) => b.duration - a.duration).slice(0, expectedCount - 1).map(g => g.index)
  );

  const groups = [];
  let groupStart = fineSegments[0].start;
  for (let i = 0; i < fineSegments.length; i++) {
    if (boundaryIndices.has(i)) {
      groups.push({ start: groupStart, end: fineSegments[i].end });
      groupStart = fineSegments[i + 1].start;
    }
  }
  groups.push({ start: groupStart, end: fineSegments[fineSegments.length - 1].end });
  return groups;
}

// Extracts one group, trims any residual edge silence, lightly normalizes
// loudness, and standardizes format/sample rate. Internal pauses within the
// group (e.g. a blend demo's "sound... sound... word" cadence) are left
// untouched — only the outer edges are trimmed.
function extractSegment(inputPath, segment, outPath) {
  const thresh = dbToLinear(NOISE_FLOOR_DB);
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
  const fineSegments = computeFineSegments(silenceIntervals, totalDuration);
  const groups = groupByTopGaps(fineSegments, take.order.length);

  if (!groups) {
    return {
      take,
      error: `only found ${fineSegments.length} distinct sound(s), need at least ${take.order.length}`,
    };
  }

  return { take, filePath, groups };
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatGroups(groups, itemLabels) {
  const durations = groups.map(g => g.end - g.start);
  const med = median(durations);
  return groups
    .map((g, i) => {
      const dur = g.end - g.start;
      const ratio = med > 0 ? dur / med : 1;
      const flag = ratio >= OUTLIER_HIGH_RATIO
        ? '  ⚠ SUSPICIOUSLY LONG — may contain more than one item'
        : ratio <= OUTLIER_LOW_RATIO
          ? '  ⚠ SUSPICIOUSLY SHORT — may be a fragment'
          : '';
      const label = itemLabels ? ` "${itemLabels[i]}"` : '';
      return `    [${i}]${label} ${g.start.toFixed(2)}s - ${g.end.toFixed(2)}s (${dur.toFixed(2)}s)${flag}`;
    })
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

  let anyFatal = false;
  for (const analysis of analyses) {
    const { take } = analysis;
    if (analysis.error) {
      console.error(`✗ ${take.file}: ${analysis.error}`);
      anyFatal = true;
      continue;
    }
    console.log(`✓ ${take.file}: split into ${analysis.groups.length} ${take.label}(s) (expected ${take.order.length})`);
    console.log(formatGroups(analysis.groups, take.order));
    console.log('');
  }

  if (anyFatal) {
    console.error(
      'One or more takes could not be split at all — stopping WITHOUT writing\n' +
        'any output files. Re-record the take(s) listed above.'
    );
    process.exit(1);
  }

  console.log(
    'Note: item counts above are always exact by construction (we know how many\n' +
      'items each take should contain). Any ⚠ warnings above are the real signal —\n' +
      'they flag likely-wrong boundaries. Spot-check those with afplay/similar\n' +
      'before trusting the rest.\n'
  );

  console.log('Writing output files...\n');

  mkdirSync(SOUNDS_DIR, { recursive: true });
  mkdirSync(WORDS_DIR, { recursive: true });

  const letters = analyses.find(a => a.take.name === 'letters');
  const words = analyses.find(a => a.take.name === 'words');
  const blend = analyses.find(a => a.take.name === 'blend');

  const written = [];

  LETTER_ORDER.forEach((id, i) => {
    const outPath = path.join(SOUNDS_DIR, `${id}.wav`);
    extractSegment(letters.filePath, letters.groups[i], outPath);
    written.push(outPath);
  });

  WORD_ORDER.forEach((word, i) => {
    const outPath = path.join(WORDS_DIR, `${word}.wav`);
    extractSegment(words.filePath, words.groups[i], outPath);
    written.push(outPath);
  });

  BLEND_ORDER.forEach((word, i) => {
    const outPath = path.join(WORDS_DIR, `${word}_blend.wav`);
    extractSegment(blend.filePath, blend.groups[i], outPath);
    written.push(outPath);
  });

  console.log(`Wrote ${written.length} files:`);
  written.forEach(p => console.log(`  ${path.relative(REPO_ROOT, p)}`));
}

main();
