#!/usr/bin/env python3
"""Kokoro TTS worker for scripts/generate-benny-voice.mjs.

Dev-only, invoked as a subprocess by the Node script — never imported by
app code, never run at runtime, never run standalone. Reads a JSON config
from stdin: {"voice": str, "speed": float, "outDir": str, "lines": {name:
text, ...}}. Writes "<outDir>/<name>.wav" for each line as it completes.

Prints "OK <name>" to stdout per line and "DONE <count>" at the end so the
Node wrapper can report progress without parsing free-form text. On
failure, prints "ERROR <message>" to stderr and exits non-zero.
"""
import json
import os
import sys


def _configure_espeak():
    """Point phonemizer (misaki/kokoro's English G2P backend) at the
    espeak-ng bundled by espeakng-loader (a misaki[en] dependency) instead
    of requiring a system espeak-ng on PATH. Must run before Kokoro/misaki
    touch phonemizer — phonemizer's EspeakBackend resolves the library on
    first use, not lazily per-call.
    """
    import espeakng_loader

    library_path = espeakng_loader.get_library_path()
    data_path = espeakng_loader.get_data_path()

    if not os.path.exists(library_path):
        raise RuntimeError(f"espeakng_loader reported a library path that doesn't exist: {library_path}")
    if not os.path.isdir(data_path):
        raise RuntimeError(f"espeakng_loader reported a data path that doesn't exist: {data_path}")

    # Env vars phonemizer's EspeakBackend falls back to if the explicit
    # wrapper calls below aren't available in the installed version —
    # belt and suspenders, both point at the same bundled copy.
    os.environ.setdefault("PHONEMIZER_ESPEAK_LIBRARY", library_path)
    os.environ.setdefault("PHONEMIZER_ESPEAK_PATH", data_path)

    try:
        from phonemizer.backend.espeak.wrapper import EspeakWrapper

        EspeakWrapper.set_library(library_path)
        if hasattr(EspeakWrapper, "set_data_path"):
            EspeakWrapper.set_data_path(data_path)
    except Exception:
        # Older/newer phonemizer versions may not expose these calls — the
        # env vars set above still point it at the bundled copy either way.
        pass


def main():
    _configure_espeak()

    config = json.load(sys.stdin)
    voice = config["voice"]
    speed = config["speed"]
    out_dir = config["outDir"]
    lines = config["lines"]

    from kokoro import KPipeline
    import numpy as np
    import soundfile as sf

    # Kokoro's voice-naming convention encodes the language as the first
    # character (a=American English, b=British English, p=Brazilian
    # Portuguese, ...) — deriving it from the voice name means a future PT
    # voice (e.g. a "pf_..."/"pm_..." one) needs no change here, just a
    # different VOICE constant in the Node wrapper.
    lang_code = voice[0]
    pipeline = KPipeline(lang_code=lang_code)

    for name, text in lines.items():
        chunks = []
        for _, _, audio in pipeline(text, voice=voice, speed=speed):
            chunk = audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio)
            chunks.append(chunk)
        if not chunks:
            raise RuntimeError(f'Kokoro produced no audio for "{name}" ("{text}")')
        full = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]

        # Peak-normalize with plain numpy (no ffmpeg, no pydub) so every
        # line sits at a consistent, comfortable level — leaves 3dB of
        # headroom so nothing clips.
        peak = float(np.max(np.abs(full))) if full.size else 0.0
        if peak > 0:
            target_peak = 10 ** (-3 / 20)
            full = full * (target_peak / peak)

        sf.write(f"{out_dir}/{name}.wav", full, 24000)
        print(f"OK {name}", flush=True)

    print(f"DONE {len(lines)}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001 — deliberately broad: any failure here should surface to Node as a clear ERROR line, not a raw traceback
        print(f"ERROR {e}", file=sys.stderr, flush=True)
        sys.exit(1)
