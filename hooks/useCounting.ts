import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LEVEL_ID, getLevel, LEVELS, LevelConfig, LevelId } from '../constants/levels';
import { DEFAULT_SUBJECT_ID, getSubject, SUBJECTS, SubjectConfig, SubjectId } from '../constants/subjects';

export type CountingItem = {
  id: number;
  counted: boolean;
  order: number | null;
};

// 'peeking' is the subitizing level's brief, non-interactive look at the
// whole set before it becomes a normal tap-to-count round (see
// constants/levels.ts LevelConfig.peek). Every other level skips it.
export type Phase = 'peeking' | 'playing' | 'roundComplete' | 'sessionComplete';

const STORAGE_KEY_HIGHEST = 'littleCounter.highestCountReached';
const STORAGE_KEY_LEVEL = 'littleCounter.levelId';
const STORAGE_KEY_SUBJECT = 'littleCounter.subjectId';

function isLevelId(value: string): value is LevelId {
  return LEVELS.some(l => l.id === value);
}

function isSubjectId(value: string): value is SubjectId {
  return SUBJECTS.some(s => s.id === value);
}

function makeItems(n: number): CountingItem[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, counted: false, order: null }));
}

function startingPhase(lvl: LevelConfig): Phase {
  return lvl.peek ? 'peeking' : 'playing';
}

export type TapResult = { assignedOrder: number | null; isNew: boolean };

export default function useCounting() {
  const [levelId, setLevelIdState] = useState<LevelId>(DEFAULT_LEVEL_ID);
  const level: LevelConfig = getLevel(levelId);

  const [subjectId, setSubjectIdState] = useState<SubjectId>(DEFAULT_SUBJECT_ID);
  const subject: SubjectConfig = getSubject(subjectId);

  const [round, setRound] = useState(1);
  const [items, setItems] = useState<CountingItem[]>(() => makeItems(1));
  const [countedCount, setCountedCount] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => startingPhase(getLevel(DEFAULT_LEVEL_ID)));
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
          setPhase(startingPhase(getLevel(value)));
        }
      })
      .catch(() => {
        // no persisted level yet — default stands
      });

    AsyncStorage.getItem(STORAGE_KEY_SUBJECT)
      .then(value => {
        if (value && isSubjectId(value)) {
          setSubjectIdState(value);
        }
      })
      .catch(() => {
        // no persisted subject yet — default stands
      });
  }, []);

  const persistHighest = useCallback((n: number) => {
    if (n <= highestRef.current) return;
    highestRef.current = n;
    setHighestCountReached(n);
    AsyncStorage.setItem(STORAGE_KEY_HIGHEST, String(n)).catch(() => {});
  }, []);

  // A level or subject change swaps what's being played out from under any
  // in-progress round, so start the new session cleanly rather than leave a
  // stale one (mismatched item count, or counted objects from the old subject).
  // Takes the target level explicitly rather than closing over the current
  // one, since callers (setLevel) know the new level before this render's
  // `level` variable reflects it.
  const resetToRoundOne = useCallback((forLevel: LevelConfig) => {
    setRound(1);
    setItems(makeItems(1));
    setCountedCount(0);
    setPhase(startingPhase(forLevel));
  }, []);

  // Pure counting logic: tap order (not array index) assigns each object its
  // number, re-taps just replay it. No side effects run inside the updater.
  const tapItem = useCallback(
    (index: number): TapResult | null => {
      if (phase !== 'playing') return null; // peeking objects aren't tappable yet
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
    [phase, items, countedCount, round, persistHighest]
  );

  // Ends the subitizing "peek" beat and reveals the round for normal
  // tap-to-count play. A no-op if called outside 'peeking' (e.g. a stale
  // timer firing after the level changed) so it can't clobber other phases.
  const endPeek = useCallback(() => {
    setPhase(prev => (prev === 'peeking' ? 'playing' : prev));
  }, []);

  const nextRound = useCallback(() => {
    if (round >= level.maxCount) {
      setPhase('sessionComplete');
      return;
    }
    const next = round + 1;
    setRound(next);
    setItems(makeItems(next));
    setCountedCount(0);
    setPhase(startingPhase(level));
  }, [round, level]);

  const restartSession = useCallback(() => {
    resetToRoundOne(level);
  }, [level, resetToRoundOne]);

  const setLevel = useCallback(
    (id: LevelId) => {
      const chosen = getLevel(id);
      if (chosen.comingSoon) return; // not playable yet — see constants/levels.ts
      setLevelIdState(id);
      AsyncStorage.setItem(STORAGE_KEY_LEVEL, id).catch(() => {});
      resetToRoundOne(chosen);
    },
    [resetToRoundOne]
  );

  const setSubject = useCallback(
    (id: SubjectId) => {
      const chosen = getSubject(id);
      if (chosen.comingSoon) return; // not playable yet — see constants/subjects.ts
      setSubjectIdState(id);
      AsyncStorage.setItem(STORAGE_KEY_SUBJECT, id).catch(() => {});
      resetToRoundOne(level); // subject doesn't affect phase — current level still applies
    },
    [level, resetToRoundOne]
  );

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
    subject,
    subjectId,
    setSubject,
    tapItem,
    endPeek,
    nextRound,
    restartSession,
  } as const;
}
