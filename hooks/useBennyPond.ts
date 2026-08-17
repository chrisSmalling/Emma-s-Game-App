import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import useCounting from './useCounting';
import useBennyVoice from './useBennyVoice';
import useBennyChoreography from './useBennyChoreography';
import { getProfile } from '../constants/profile';
import { BennyState } from '../components/benny/Benny';

// Benny's Pond — the character-first, PERFORMANCE-first redesign (see
// "Emma's App — Benny's Pond: from task to performance"). The flat
// tap-to-count version tested as a silent task and lost her in under a
// minute; this makes Benny perform the count himself first, invite her in,
// warmly take over if she doesn't jump in, and vary each loop so it never
// repeats identically. Wraps the existing, tested counting engine
// (hooks/useCounting.ts, untouched) and the pure choreography state
// machine (hooks/useBennyChoreography.ts) with the async narration/timing
// that ties them together.

const GREETING_DURATION_MS = 2800;
const BEAT_MS = 500; // pause after a narration line before the next beat
const SHORT_BEAT_MS = 400;
const PERFORM_STEP_MS = 750; // rhythmic pause between each fish being counted (perform or Benny-helps)
const COUNT_SETTLE_MS = 700; // back to 'waiting' this long after her own tap's count is spoken
const BEAT_BEFORE_CELEBRATE_MS = 300;
const CELEBRATE_HOLD_MS = 2600;

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export default function useBennyPond() {
  const counting = useCounting();
  const voice = useBennyVoice();
  const choreography = useBennyChoreography();
  const childName = getProfile().childName;

  const [greeted, setGreeted] = useState(false);
  const [bennyState, setBennyState] = useState<BennyState>('idle');
  // Increments once per fish counted (his own performance, her tap, or his
  // warm fallback) so Benny.tsx can fire one small bounce in sync with the
  // count, independent of `bennyState` itself — see Benny.tsx's countPulse.
  const [countPulse, setCountPulse] = useState(0);
  const greetedOnceRef = useRef(false);

  function pulseCount() {
    setCountPulse(c => c + 1);
  }

  // Async choreography sequences call counting.tapItem multiple times in a
  // row (the Benny-helps fallback). counting.tapItem is a fresh closure
  // every render — reading it straight from a long-lived async function
  // would replay the SAME stale countedCount on every call instead of
  // seeing each prior call's result. This ref always holds the latest
  // render's counting, so re-reading countingRef.current between awaits
  // (after React has had a chance to re-render) picks up each update.
  const countingRef = useRef(counting);
  useEffect(() => {
    countingRef.current = counting;
  });

  // Invalidates any in-flight async sequence when a newer one starts, so a
  // stale perform/help/delight sequence from a previous beat can't keep
  // running (and racing) after something else has moved the beat on.
  const epochRef = useRef(0);

  // The greeting plays once, then starts the first performance loop — see
  // advanceFromGreeting for the "she taps first" path.
  useEffect(() => {
    if (greetedOnceRef.current) return;
    greetedOnceRef.current = true;
    // Web browsers block audio that isn't a direct response to a user
    // gesture, and the greeting fires on mount — before any tap — so it
    // would otherwise throw there (native has no such restriction; the
    // on-screen greeting still shows immediately either way).
    if (Platform.OS !== 'web') voice.playGreeting();
    const t = setTimeout(() => setGreeted(true), GREETING_DURATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function advanceFromGreeting() {
    setGreeted(true);
  }

  // Kicks off a fresh performance loop once greeted, and again every time
  // the choreography starts a new (varied) loop.
  useEffect(() => {
    if (!greeted) return;
    const epoch = ++epochRef.current;
    runPerformSequence(epoch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greeted, choreography.loopIndex]);

  // Benny cheerfully takes over once the wait timeout elapses with no tap.
  useEffect(() => {
    if (choreography.beat !== 'together' || choreography.togetherMode !== 'benny') return;
    const epoch = ++epochRef.current;
    runBennyHelpSequence(epoch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choreography.beat, choreography.togetherMode]);

  // Shared celebration, then advances to the next (varied) loop.
  useEffect(() => {
    if (choreography.beat !== 'delight') return;
    const epoch = ++epochRef.current;
    runDelightSequence(epoch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choreography.beat]);

  // Beat 1 (brief step 1): Benny performs the count himself — she just
  // watches. Uses choreography.markPerformed (a visual-only overlay), NOT
  // counting.tapItem, so the real round stays fresh for her turn next.
  async function runPerformSequence(epoch: number) {
    const current = () => epoch === epochRef.current;
    const { variation } = choreography;
    const itemCount = counting.items.length;

    setBennyState('curious');
    await voice.playLine(variation.performOpeningKey);
    if (!current()) return;
    await wait(BEAT_MS);

    setBennyState('counting');
    for (let i = 0; i < itemCount; i++) {
      if (!current()) return;
      choreography.markPerformed(i);
      await voice.playCount(i + 1);
      if (!current()) return;
      pulseCount();
      await wait(PERFORM_STEP_MS);
    }

    if (!current()) return;
    setBennyState('proud');
    await voice.playLine('perform_wow');
    if (!current()) return;
    await wait(BEAT_MS);

    // Beat 2 (brief step 2): invite, then wait for her.
    if (!current()) return;
    choreography.startInvite();
    setBennyState('waiting');
    await voice.playLine('invite');
    if (!current()) return;
    await wait(SHORT_BEAT_MS);

    if (!current()) return;
    choreography.startWait();
  }

  // The "impossible to be stuck" fallback: she didn't tap within the wait
  // window, so Benny finishes the real round himself, warmly, one fish at
  // a time — same rhythm as his own performance, but this time it's the
  // actual round completing.
  async function runBennyHelpSequence(epoch: number) {
    const current = () => epoch === epochRef.current;
    const itemCount = countingRef.current.items.length;

    setBennyState('counting');
    await voice.playLine('together');
    if (!current()) return;
    await wait(BEAT_MS);

    for (let i = 0; i < itemCount; i++) {
      if (!current()) return;
      const result = countingRef.current.tapItem(i);
      if (result && result.assignedOrder != null) {
        await voice.playCount(result.assignedOrder);
        if (!current()) return;
        pulseCount();
      }
      if (!current()) return;
      await wait(PERFORM_STEP_MS);
    }

    if (!current()) return;
    choreography.startDelight();
  }

  // Beat 3 (brief step 3): shared delight, then beat 4 — a varied next loop.
  async function runDelightSequence(epoch: number) {
    const current = () => epoch === epochRef.current;

    setBennyState('celebrating');
    await wait(BEAT_BEFORE_CELEBRATE_MS);
    if (!current()) return;
    await voice.playCelebrate();
    if (!current()) return;
    setBennyState('proud');
    await wait(CELEBRATE_HOLD_MS);
    if (!current()) return;

    if (countingRef.current.round >= countingRef.current.roundsPerSession) {
      countingRef.current.restartSession();
    } else {
      countingRef.current.nextRound();
    }
    setBennyState('idle');
    choreography.nextLoop();
  }

  // Her real taps — only meaningful once Benny has invited her in (wait)
  // or she's already counting alongside him (together, mode 'child').
  async function handleFishTap(index: number) {
    const beat = choreography.beat;
    if (beat !== 'wait' && beat !== 'together') return;
    if (beat === 'wait') {
      choreography.childTapped();
    } else if (choreography.togetherMode === 'benny') {
      // Benny's already mid-fallback for this round — ignore rather than
      // race his sequence (harmless either way since tapItem is
      // idempotent, but this avoids overlapping sounds).
      return;
    }

    const result = counting.tapItem(index);
    if (!result || result.assignedOrder == null) return;
    const isRoundComplete = result.isNew && result.assignedOrder === counting.items.length;

    setBennyState('counting');
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // ignore — haptics is a nice-to-have, never blocks the interaction
    }
    await voice.playCount(result.assignedOrder);
    pulseCount();

    if (isRoundComplete) {
      choreography.startDelight();
    } else {
      await wait(COUNT_SETTLE_MS);
      setBennyState('waiting');
    }
  }

  return {
    childName,
    greeted,
    bennyState,
    countPulse,
    beat: choreography.beat,
    variation: choreography.variation,
    items: counting.items,
    performCounted: choreography.performCounted,
    fishInteractive: choreography.beat === 'wait' || (choreography.beat === 'together' && choreography.togetherMode === 'child'),
    advanceFromGreeting,
    handleFishTap,
  } as const;
}
