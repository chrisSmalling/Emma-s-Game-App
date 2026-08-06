A thin sound wrapper for Stage 0.

This module centralizes audio loading and playback so the rest of the app can call
playNumber/playSfx/speak without duplicating load/unload logic. We keep this
implementation on expo-av for Stage 0 and will migrate to expo-audio (useAudioPlayer)
in a follow-up Stage.
