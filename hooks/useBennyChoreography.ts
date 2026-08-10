import { useEffect, useRef, useState } from 'react';

// The performance loop's choreography — pure state machine, no dependency
// on useCounting or useBennyVoice, so it's testable in isolation (see
// useBennyChoreography.test.ts). useBennyPond.ts is the orchestrator that
// drives this alongside the counting engine and voice playback.
//
// The beat (see "Benny's First Magical Slice: Performance" redesign):
//   perform  — Benny counts the fish himself; she just watches. Not a real
//              round yet — see performCounted below.
//   invite   — Benny asks "Can YOU count them?" (brief, no timer).
//   wait     — fish are tappable; Benny waits warmly. A timer decides what
//              happens next — see childTapped/the wait timeout.
//   together — the round is actively being completed, either because she
//              tapped (togetherMode 'child') or because the wait timer
//              elapsed and Benny is finishing it for her (togetherMode
//              'benny') — "impossible to be stuck": either way it reaches
//              delight.
//   delight  — shared celebration, then nextLoop() starts a fresh (varied)
//              perform beat.

export type PerformBeat = 'perform' | 'invite' | 'wait' | 'together' | 'delight';
export type TogetherMode = 'child' | 'benny' | null;
export type LoopComponentId = 'fish' | 'shapes' | 'colors';

export type LoopVariation = {
  // Which pre-recorded "Benny notices the pond" opener plays at the start
  // of this loop's perform beat.
  performOpeningKey: 'perform_open_1' | 'perform_open_2' | 'perform_open_3';
  // Which countable-object visual fills the pond this loop — swapping in
  // Shape/ColorBlob (already-built, already CountableObjectProps-shaped
  // components) alongside Fish is the cheapest way to satisfy "a different
  // creature appears / something new in the pond" without new art.
  component: LoopComponentId;
};

// The variation set — edit freely; the loop just cycles through these in
// order (loopIndex % length), so adding/removing/reordering entries is the
// entire mechanism for "what's the next loop's novelty." Deliberately not
// every entry has a different component: `fish` stays the default most of
// the time, "something new" is an occasional surprise, not the norm.
const VARIATIONS: LoopVariation[] = [
  { performOpeningKey: 'perform_open_1', component: 'fish' },
  { performOpeningKey: 'perform_open_1', component: 'fish' },
  { performOpeningKey: 'perform_open_2', component: 'fish' },
  { performOpeningKey: 'perform_open_3', component: 'shapes' },
  { performOpeningKey: 'perform_open_2', component: 'fish' },
  { performOpeningKey: 'perform_open_3', component: 'colors' },
];

export function pickVariation(loopIndex: number): LoopVariation {
  return VARIATIONS[loopIndex % VARIATIONS.length];
}

// How long Benny waits after inviting before cheerfully taking over —
// generous enough that a toddler pausing to look isn't rushed, short
// enough that "waiting" never reads as the app being stuck.
const WAIT_TIMEOUT_MS = 4500;

export default function useBennyChoreography() {
  const [beat, setBeat] = useState<PerformBeat>('perform');
  const [loopIndex, setLoopIndex] = useState(0);
  const [performCounted, setPerformCounted] = useState<number[]>([]);
  const [togetherMode, setTogetherMode] = useState<TogetherMode>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearWaitTimer() {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }

  useEffect(() => clearWaitTimer, []);

  // Marks one more fish as part of Benny's own performance (perform beat
  // only) — a visual-only overlay, independent of the real counting round,
  // so the round is still fresh for her once he's done.
  function markPerformed(index: number) {
    setPerformCounted(prev => (prev.includes(index) ? prev : [...prev, index]));
  }

  function startInvite() {
    setBeat('invite');
  }

  function startWait() {
    clearWaitTimer();
    setBeat('wait');
    waitTimerRef.current = setTimeout(() => {
      setTogetherMode('benny');
      setBeat('together');
    }, WAIT_TIMEOUT_MS);
  }

  // A no-op unless we're actually waiting on her — guards against a stray
  // tap during 'perform'/'invite'/'delight' doing anything.
  function childTapped() {
    if (beat !== 'wait') return;
    clearWaitTimer();
    setTogetherMode('child');
    setBeat('together');
  }

  function startDelight() {
    clearWaitTimer();
    setBeat('delight');
  }

  // Advances to the next (varied) loop and returns to perform.
  function nextLoop() {
    clearWaitTimer();
    setPerformCounted([]);
    setTogetherMode(null);
    setLoopIndex(i => i + 1);
    setBeat('perform');
  }

  return {
    beat,
    loopIndex,
    variation: pickVariation(loopIndex),
    performCounted,
    togetherMode,
    markPerformed,
    startInvite,
    startWait,
    childTapped,
    startDelight,
    nextLoop,
  } as const;
}
