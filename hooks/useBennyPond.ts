import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import useCounting from './useCounting';
import useBennyVoice from './useBennyVoice';
import { getProfile } from '../constants/profile';
import { BennyState } from '../components/benny/Benny';

// Benny's Pond — the character-first slice (see the redesign brief: "Emma's
// App — Benny's First Magical Slice"). Wraps the existing, tested counting
// engine (hooks/useCounting.ts, untouched) with the experience layer that
// was missing: Benny greets her by name, invites her to count the fish,
// reacts and counts along with every tap, and is proud of her when the
// pond's fish are all counted — then a fresh pond starts, since this is a
// standalone moment to keep testing, not a multi-round session with exit
// screens.

export type PondStage = 'greeting' | 'counting' | 'celebrating';

// Long enough to actually feel like a greeting, short enough that an
// impatient tap (which also advances immediately — see handleScenePress)
// is never really "waiting."
const GREETING_DURATION_MS = 2800;
const COUNT_SETTLE_MS = 700; // back to 'happy' this long after a tap's count is spoken
const BEAT_BEFORE_PRAISE_MS = 300;
const CELEBRATE_DURATION_MS = 2600;

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export default function useBennyPond() {
  const counting = useCounting();
  const voice = useBennyVoice();
  const childName = getProfile().childName;

  const [stage, setStage] = useState<PondStage>('greeting');
  const [bennyState, setBennyState] = useState<BennyState>('curious');
  const greetedRef = useRef(false);

  // The greeting plays once, then auto-advances to counting after a beat —
  // see advanceFromGreeting for the "she taps first" path.
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    // Web browsers block audio that isn't a direct response to a user
    // gesture, and the greeting fires on mount — before any tap — so it
    // would otherwise throw there (native has no such restriction; the
    // on-screen greeting still shows immediately either way). She'll hear
    // Benny's other lines fine on web too, since every one of those is
    // gesture-triggered by a tap.
    if (Platform.OS !== 'web') voice.playGreeting();
    const t = setTimeout(() => {
      setStage(prev => (prev === 'greeting' ? 'counting' : prev));
      setBennyState(prev => (prev === 'curious' ? 'happy' : prev));
    }, GREETING_DURATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A tap anywhere during the greeting skips straight to counting — "she
  // taps the empty screen" should always do *something*, never be ignored.
  function advanceFromGreeting() {
    if (stage !== 'greeting') return;
    setStage('counting');
    setBennyState('happy');
  }

  async function handleFishTap(index: number) {
    if (stage !== 'counting') return;
    // A no-op if the underlying round is mid-"peek" (constants/levels.ts's
    // subitizing level) — shared, persisted state with the Counting
    // activity, deliberately left untouched here (changing it would
    // silently override a parent's Counting settings). Fresh installs
    // default to a level with no peek, which is the real test scenario.
    const result = counting.tapItem(index);
    if (!result || result.assignedOrder == null) return;

    const isRoundComplete = result.isNew && result.assignedOrder === counting.items.length;

    setBennyState('countingAlong');
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // ignore — haptics is a nice-to-have, never blocks the interaction
    }
    await voice.playCount(result.assignedOrder);

    if (isRoundComplete) {
      setStage('celebrating');
      await wait(BEAT_BEFORE_PRAISE_MS);
      setBennyState('proud');
      await voice.playPraise();
      await wait(CELEBRATE_DURATION_MS);

      // A fresh pond to keep the moment going — this is one continuous
      // experience to test, not a session with an exit screen.
      if (counting.round >= counting.roundsPerSession) {
        counting.restartSession();
      } else {
        counting.nextRound();
      }
      setStage('counting');
      setBennyState('happy');
    } else {
      await wait(COUNT_SETTLE_MS);
      setBennyState(prev => (prev === 'countingAlong' ? 'happy' : prev));
    }
  }

  return {
    childName,
    stage,
    bennyState,
    items: counting.items,
    advanceFromGreeting,
    handleFishTap,
  } as const;
}
