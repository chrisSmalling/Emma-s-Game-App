import { useCallback, useState } from 'react';

export type CountingItem = {
  id: number;
  counted: boolean;
  order?: number | null;
};

export default function useCounting(initialCount = 1) {
  const [items, setItems] = useState<CountingItem[]>(() =>
    Array.from({ length: initialCount }, (_, i) => ({ id: i, counted: false, order: null }))
  );
  const [countedCount, setCountedCount] = useState(0);

  const initRound = useCallback((n: number) => {
    setItems(Array.from({ length: n }, (_, i) => ({ id: i, counted: false, order: null })));
    setCountedCount(0);
  }, []);

  const onTapIndex = useCallback((index: number) => {
    const it = items[index];
    if (!it) return { assignedOrder: null, isNew: false };

    if (it.counted) {
      return { assignedOrder: it.order ?? index + 1, isNew: false };
    }

    const thisNumber = countedCount + 1;

    // Pure state update (no side effects here)
    setItems(prev => prev.map((x, i) => (i === index ? { ...x, counted: true, order: thisNumber } : x)));
    setCountedCount(c => c + 1);

    return { assignedOrder: thisNumber, isNew: true };
  }, [items, countedCount]);

  const isRoundComplete = useCallback(() => items.length > 0 && countedCount === items.length, [items, countedCount]);

  return {
    items,
    countedCount,
    initRound,
    onTapIndex,
    isRoundComplete,
  } as const;
}
