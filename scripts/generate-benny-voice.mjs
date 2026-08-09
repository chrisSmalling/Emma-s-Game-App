#!/usr/bin/env node
// One-time (re-runnable) local generation of Benny's spoken lines using a
// real neural TTS voice — replacing the silent placeholder WAVs currently
// at assets/audio/benny/en/*.wav so the app builds/runs today with no
// audible lines yet, rather than failing to bundle (Metro requires every
// require() path to resolve to a real file).
//
// NEVER imported by app code, NEVER run at runtime. Requires:
//   1. Piper (the TTS engine) — already installable via `pip install piper-tts`.
//   2. A Piper VOICE MODEL (.onnx + .onnx.json) — NOT bundled with Piper
//      itself. Download a warm-sounding one, e.g. from Piper's voice
//      catalog: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US
//      A good starting point for a warm, natural adult male voice:
//        en_US-joe-medium (or try a few — "medium"/"high" quality tiers
//        sound noticeably better than "low"; avoid anything named
//        "x_low"). Whatever you pick, do NOT use eSpeak — that's exactly
//        the robotic voice this is meant to avoid.
//      Download both files into one folder, e.g. ~/piper-voices/:
//        en_US-joe-medium.onnx
//        en_US-joe-medium.onnx.json
//
// Usage:
//   node scripts/generate-benny-voice.mjs /path/to/en_US-joe-medium.onnx
//
// (This machine's sandbox can't reach huggingface.co/github release assets
// to fetch a voice model itself — see the session notes — so this script
// takes the model as a local path rather than downloading one.)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'assets/audio/benny/en');

// Benny's full line set for the slice — few and known, per the brief.
// childName is hardcoded to Emma here deliberately: this generates the one
// real child's actual bundled audio, not a general per-name TTS system.
// hooks/useBennyVoice.ts keys the greeting off profile.childName and only
// plays it for a recognized name — see that file's comment.
const LINES = {
  greeting: "Hi, Emma! Let's count the fish in my pond!",
  count_1: 'One!',
  count_2: 'Two!',
  count_3: 'Three!',
  count_4: 'Four!',
  count_5: 'Five!',
  praise_1: 'Yay! You did it!',
  praise_2: 'Great counting!',
};

function findConfigPath(modelPath) {
  const withJson = `${modelPath}.json`;
  if (existsSync(withJson)) return withJson;
  const swapped = modelPath.replace(/\.onnx$/, '.json');
  if (existsSync(swapped)) return swapped;
  return null;
}

function main() {
  const modelPath = process.argv[2];
  if (!modelPath || !existsSync(modelPath)) {
    console.error(
      'Usage: node scripts/generate-benny-voice.mjs /path/to/voice.onnx\n\n' +
        'Needs a real Piper voice model (.onnx + .onnx.json) downloaded from\n' +
        'https://huggingface.co/rhasspy/piper-voices — see this file\'s header\n' +
        'comment for a recommended starting voice. Not eSpeak.'
    );
    process.exit(1);
  }
  const configPath = findConfigPath(modelPath);
  if (!configPath) {
    console.error(`Couldn't find ${modelPath}.json (or the sibling .json) — the voice's config file must sit next to the .onnx.`);
    process.exit(1);
  }

  try {
    execFileSync('piper', ['--help'], { stdio: 'pipe' });
  } catch {
    console.error("Piper isn't on PATH. Install it first: pip install piper-tts");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Generating Benny's lines with ${path.basename(modelPath)}...\n`);
  for (const [name, text] of Object.entries(LINES)) {
    const rawPath = path.join(OUT_DIR, `${name}.raw.wav`);
    const outPath = path.join(OUT_DIR, `${name}.wav`);

    execFileSync('piper', ['-m', modelPath, '-c', configPath, '-f', rawPath], {
      input: text,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Light loudness normalize + standardize to mono, matching the phonics
    // pipeline's approach (scripts/process-voice-recordings.mjs) so Benny's
    // lines sit at a consistent, comfortable level next to the rest of the
    // app's audio.
    execFileSync('ffmpeg', ['-y', '-i', rawPath, '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-ac', '1', outPath], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    execFileSync('rm', [rawPath]);

    console.log(`  ✓ ${name}.wav — "${text}"`);
  }

  console.log(`\nDone. Wrote ${Object.keys(LINES).length} files to ${path.relative(REPO_ROOT, OUT_DIR)}/`);
  console.log('Spot-check a couple with afplay/similar before trusting the rest.');
}

main();
