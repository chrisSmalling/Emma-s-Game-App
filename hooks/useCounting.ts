import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LEVEL_ID, getLevel, LEVELS, LevelConfig, LevelId } from '../constants/levels';

export type CountingItem = {
  id: number;
  counted: boolean;
  order: number | null;
};

export type Phase = 'playing' | 'roundComplete' | 'sessionComplete';

const STORAGE_KEY_HIGHEST = 'littleCounter.highestCountReached';
const STORAGE_KEY_LEVEL = 'littleCounter.levelId';

function isLevelId(value: string): value is LevelId {
  return LEVELS.some(l => l.id === value);
}

function makeItems(n: number): CountingItem[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, counted: false, order: null }));
}

export type TapResult = { assignedOrder: number | null; isNew: boolean };

export default function useCounting() {
  const [levelId, setLevelIdState] = useState<LevelId>(DEFAULT_LEVEL_ID);
  const level: LevelConfig = getLevel(levelId);

  const [round, setRound] = useState(1);
  const [items, setItems] = useState<CountingItem[]>(() => makeItems(1));
  const [countedCount, setCountedCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [highestCountReached, setHighestCountReached] = useState(0);
  const highestRef = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_HIGHEST)
      .then(value => {
        const n = value ? parseInt(value, 10) : 0;
        if (!Number.isNaN(n) && n > 0) {
          highestRef.current = n;
          setHighestCountReached(n);
        }
      })
      .catch(() => {
        // no persisted value yet, or storage unavailable — start fresh
      });

    AsyncStorage.getItem(STORAGE_KEY_LEVEL)
      .then(value => {
        if (value && isLevelId(value)) {
          setLevelIdState(value);
        }
      })
      .catch(() => {
        // no persisted level yet — default stands
      });
  }, []);

  const persistHighest = useCallback((n: number) => {
    if (n <= highestRef.current) return;
    highestRef.current = n;
    setHighestCountReached(n);
    AsyncStorage.setItem(STORAGE_KEY_HIGHEST, String(n)).catch(() => {});
  }, []);

  // Pure counting logic: tap order (not array index) assigns each object its
  // number, re-taps just replay it. No side effects run inside the updater.
  const tapItem = useCallback(
    (index: number): TapResult | null => {
      const it = items[index];
      if (!it) return null;

      if (it.counted) {
        return { assignedOrder: it.order, isNew: false };
      }

      const assignedOrder = countedCount + 1;
      setItems(prev => prev.map((x, i) => (i === index ? { ...x, counted: true, order: assignedOrder } : x)));
      setCountedCount(assignedOrder);

      if (assignedOrder === items.length) {
        setPhase('roundComplete');
        persistHighest(round);
      }

      return { assignedOrder, isNew: true };
    },
    [items, countedCount, round, persistHighest]
  );

  const nextRound = useCallback(() => {
    if (round >= level.maxCount) {
      setPhase('sessionComplete');
      return;
    }
    const next = round + 1;
    setRound(next);
    setItems(makeItems(next));
    setCountedCount(0);
    setPhase('playing');
  }, [round, level.maxCount]);

  const restartSession = useCallback(() => {
    setRound(1);
    setItems(makeItems(1));
    setCountedCount(0);
    setPhase('playing');
  }, []);

  const setLevel = useCallback((id: LevelId) => {
    const chosen = getLevel(id);
    if (chosen.comingSoon) return; // not playable yet — see constants/levels.ts
    setLevelIdState(id);
    AsyncStorage.setItem(STORAGE_KEY_LEVEL, id).catch(() => {});
    // A level change swaps the round range out from under any in-progress
    // round, so start the new session cleanly rather than leave a stale one.
    setRound(1);
    setItems(makeItems(1));
    setCountedCount(0);
    setPhase('playing');
  }, []);

  return {
    round,
    roundsPerSession: level.maxCount,
    items,
    countedCount,
    phase,
    highestCountReached,
    level,
    levelId,
    setLevel,
    tapItem,
    nextRound,
    restartSession,
  } as const;
}
