#!/usr/bin/env node
// One-time (re-runnable) local generation of Benny's spoken lines using
// Kokoro — a warm, modern, open-source (Apache 2.0, commercial-OK) neural
// TTS that runs on CPU — replacing the silent placeholder WAVs currently at
// assets/audio/benny/en/*.wav so the app builds/runs today with no audible
// lines yet, rather than failing to bundle (Metro requires every require()
// path to resolve to a real file).
//
// NEVER imported by app code, NEVER run at runtime — a dev-only generation
// tool, same posture as scripts/generate-phonics-audio.mjs and
// scripts/process-voice-recordings.mjs. It only produces static .wav files
// that ship in assets/audio/benny/en/; the running app stays fully
// offline/collect-nothing either way.
//
// Requires (on your machine, not in any sandboxed dev session):
//   1. Python 3 with Kokoro + soundfile:
//        pip install kokoro soundfile
//      Kokoro pulls in torch and misaki (its G2P library) as dependencies —
//      the install downloads a fair bit, that's expected.
//   2. espeak-ng, for phonemization (Kokoro's English fallback path) — per
//      your note this is already installed.
//   3. Normal internet access the first time you run this: Kokoro downloads
//      its model weights from Hugging Face on first use and caches them
//      locally after that. (This is exactly the step that isn't possible
//      from a network-sandboxed dev session — run this script from your
//      own machine.)
//
// This script itself is just the Node-side orchestrator: it shells out to
// scripts/generate_benny_voice_kokoro.py (a small worker that loads the
// Kokoro pipeline once and generates every line in a single process,
// rather than paying the model-load cost per line).
//
// Usage:
//   node scripts/generate-benny-voice.mjs

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'assets/audio/benny/en');
const WORKER_PATH = path.join(__dirname, 'generate_benny_voice_kokoro.py');

// Change the voice here — see https://huggingface.co/hexgrad/Kokoro-82M
// (and the community voice pack) for the full list. Kokoro's naming
// convention encodes language + gender in the prefix (am_ = American
// male, af_ = American female, pf_/pm_ = Brazilian Portuguese female/
// male, ...) — the worker derives the language from this automatically,
// so a future PT voice is just a different value here, nothing else
// changes.
const VOICE = 'am_puck';

// Kokoro's speed control (1.0 = natural pace). Slightly slowed for a
// warmer, more deliberate delivery — tune freely.
const SPEED = 0.92;

// Benny's full line set for the slice — few and known, per the brief.
// childName is hardcoded to Emma here deliberately: this generates the one
// real child's actual bundled audio, not a general per-name TTS system.
// hooks/useBennyVoice.ts keys the greeting off profile.childName and only
// plays it for a recognized name — see that file's comment.
// The PERFORMANCE redesign's line set (see hooks/useBennyChoreography.ts /
// useBennyPond.ts for how each is used): Benny performs the count himself
// first (perform_open_* + count_1..5 + perform_wow), invites her in, and
// either counts along with her taps or — if she doesn't tap in time —
// cheerfully finishes it himself (together), always landing on a shared
// celebration (celebrate_1/2). Retired praise_1/praise_2 from the old
// solo-tap design in favor of the "we" framing below.
const LINES = {
  greeting: "Hi, Emma! Let's count the fish in my pond!",
  count_1: 'One!',
  count_2: 'Two!',
  count_3: 'Three!',
  count_4: 'Four!',
  count_5: 'Five!',
  // Rotating openers for the perform beat — picked by loop, see
  // useBennyChoreography.ts's VARIATIONS table. Keep these warm and
  // delighted, not narrated/explanatory — this is a performance, not an
  // instruction.
  perform_open_1: "Ooh, fish! Let's count!",
  perform_open_2: 'Look! More fish swam in! Let\'s count!',
  perform_open_3: 'Ooh! Something new floated into my pond! Let\'s count!',
  perform_wow: 'Wow!',
  invite: 'Can YOU count them? You try!',
  together: "Let's count together!",
  celebrate_1: "We did it! You're so good at counting!",
  celebrate_2: 'Yay! We counted them all together!',
};

function checkPrerequisites() {
  const python = spawnSync('python3', ['-c', 'import kokoro, soundfile'], { stdio: 'pipe', encoding: 'utf8' });
  if (python.error || python.status !== 0) {
    console.error(
      "Kokoro (or soundfile) isn't importable from python3. Install first:\n" +
        '  pip install kokoro soundfile\n\n' +
        (python.stderr ? `Python said:\n${python.stderr}\n` : '')
    );
    process.exit(1);
  }

  const espeak = spawnSync('espeak-ng', ['--version'], { stdio: 'pipe' });
  if (espeak.error) {
    console.error("espeak-ng isn't on PATH — Kokoro needs it for English phonemization. Install it first.");
    process.exit(1);
  }
}

function runWorker() {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [WORKER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });

    const rl = readline.createInterface({ input: child.stdout });
    let doneCount = 0;
    rl.on('line', line => {
      if (line.startsWith('OK ')) {
        const name = line.slice(3);
        console.log(`  ✓ ${name}.wav — "${LINES[name]}"`);
      } else if (line.startsWith('DONE ')) {
        doneCount = Number(line.slice(5));
      }
    });

    let stderr = '';
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        const message = stderr.trim().replace(/^ERROR\s*/, '') || `worker exited with code ${code}`;
        reject(new Error(message));
        return;
      }
      resolve(doneCount);
    });

    child.stdin.write(JSON.stringify({ voice: VOICE, speed: SPEED, outDir: OUT_DIR, lines: LINES }));
    child.stdin.end();
  });
}

async function main() {
  checkPrerequisites();
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Generating Benny's lines with Kokoro voice "${VOICE}" at speed ${SPEED}...\n`);

  let written;
  try {
    written = await runWorker();
  } catch (err) {
    console.error(`Generation failed: ${err.message}`);
    process.exit(1);
  }

  console.log(`\nDone. Wrote ${written} files to ${path.relative(REPO_ROOT, OUT_DIR)}/ (voice: ${VOICE}, speed: ${SPEED}).`);
  console.log('Spot-check a couple before trusting the rest.');
}

main();
