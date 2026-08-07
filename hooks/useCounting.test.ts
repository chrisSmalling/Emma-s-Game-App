import { act, renderHook } from '@testing-library/react-native';
import useCounting from './useCounting';

describe('useCounting', () => {
  it('starts round 1 with a single item, not counted', async () => {
    const { result } = await renderHook(() => useCounting());
    expect(result.current.round).toBe(1);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].counted).toBe(false);
    expect(result.current.countedCount).toBe(0);
  });

  it('assigns numbers by tap order, not array index', async () => {
    const { result } = await renderHook(() => useCounting());

    // Round 2 has two items — tap the second one before the first.
    await act(() => result.current.nextRound());
    expect(result.current.items).toHaveLength(2);

    let tapResult!: ReturnType<typeof result.current.tapItem>;
    await act(() => {
      tapResult = result.current.tapItem(1);
    });
    expect(tapResult).toEqual({ assignedOrder: 1, isNew: true });
    expect(result.current.items[1].order).toBe(1);
    expect(result.current.items[0].order).toBeNull();

    await act(() => {
      tapResult = result.current.tapItem(0);
    });
    expect(tapResult).toEqual({ assignedOrder: 2, isNew: true });
    expect(result.current.items[0].order).toBe(2);
  });

  it('re-tapping a counted item replays its stored order without incrementing the count', async () => {
    const { result } = await renderHook(() => useCounting());
    await act(() => result.current.nextRound()); // round 2, two items

    await act(() => {
      result.current.tapItem(0);
    });
    expect(result.current.countedCount).toBe(1);

    let tapResult!: ReturnType<typeof result.current.tapItem>;
    await act(() => {
      tapResult = result.current.tapItem(0);
    });
    expect(tapResult).toEqual({ assignedOrder: 1, isNew: false });
    expect(result.current.countedCount).toBe(1); // unchanged — no double count
  });

  it('marks the round complete only once every item has been tapped', async () => {
    const { result } = await renderHook(() => useCounting());
    await act(() => result.current.nextRound()); // round 2, two items

    await act(() => {
      result.current.tapItem(0);
    });
    expect(result.current.phase).toBe('playing');

    await act(() => {
      result.current.tapItem(1);
    });
    expect(result.current.phase).toBe('roundComplete');
  });

  it('cycles rounds 1 through 5 and then reaches sessionComplete', async () => {
    const { result } = await renderHook(() => useCounting());

    for (let round = 1; round <= 5; round++) {
      expect(result.current.round).toBe(round);
      for (let i = 0; i < round; i++) {
        await act(() => {
          result.current.tapItem(i);
        });
      }
      expect(result.current.phase).toBe('roundComplete');
      await act(() => result.current.nextRound());
    }

    expect(result.current.phase).toBe('sessionComplete');
  });

  it('restartSession resets back to round 1', async () => {
    const { result } = await renderHook(() => useCounting());
    await act(() => result.current.nextRound());
    await act(() => result.current.nextRound());
    expect(result.current.round).toBe(3);

    await act(() => result.current.restartSession());
    expect(result.current.round).toBe(1);
    expect(result.current.phase).toBe('playing');
    expect(result.current.countedCount).toBe(0);
  });
});
