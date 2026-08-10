import { act, renderHook } from '@testing-library/react-native';
import useBennyChoreography, { pickVariation } from './useBennyChoreography';

describe('pickVariation', () => {
  it('is deterministic — the same loop index always picks the same variation', () => {
    expect(pickVariation(0)).toEqual(pickVariation(0));
    expect(pickVariation(3)).toEqual(pickVariation(3));
  });

  it('varies across consecutive loops rather than repeating every time', () => {
    const firstSix = Array.from({ length: 6 }, (_, i) => pickVariation(i));
    const allSame = firstSix.every(v => JSON.stringify(v) === JSON.stringify(firstSix[0]));
    expect(allSame).toBe(false);
  });

  it('cycles — wraps back to the start after the full variation set', () => {
    expect(pickVariation(0)).toEqual(pickVariation(6));
  });
});

describe('useBennyChoreography', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts on perform, loop 0, nothing performed yet', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    expect(result.current.beat).toBe('perform');
    expect(result.current.loopIndex).toBe(0);
    expect(result.current.performCounted).toEqual([]);
    expect(result.current.togetherMode).toBeNull();
    expect(result.current.variation).toEqual(pickVariation(0));
  });

  it('markPerformed appends indices in order and never duplicates', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    await act(() => result.current.markPerformed(0));
    await act(() => result.current.markPerformed(1));
    await act(() => result.current.markPerformed(0));
    expect(result.current.performCounted).toEqual([0, 1]);
  });

  it('advances perform -> invite -> wait', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    await act(() => result.current.startInvite());
    expect(result.current.beat).toBe('invite');

    await act(() => result.current.startWait());
    expect(result.current.beat).toBe('wait');
    expect(result.current.togetherMode).toBeNull();
  });

  it('a child tap during wait moves to together with mode "child" and cancels the fallback timer', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    await act(() => result.current.startWait());

    await act(() => result.current.childTapped());
    expect(result.current.beat).toBe('together');
    expect(result.current.togetherMode).toBe('child');

    // the fallback timer must be cancelled — letting it fully elapse should not flip mode to 'benny'
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });
    expect(result.current.togetherMode).toBe('child');
  });

  it('invite-timeout falls back to together with mode "benny" when she never taps', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    await act(() => result.current.startWait());

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4500);
    });
    expect(result.current.beat).toBe('together');
    expect(result.current.togetherMode).toBe('benny');
  });

  it('childTapped is a no-op outside of wait', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    // still 'perform' — never entered wait
    await act(() => result.current.childTapped());
    expect(result.current.beat).toBe('perform');
    expect(result.current.togetherMode).toBeNull();
  });

  it('startDelight moves to delight from anywhere and clears any pending timer', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    await act(() => result.current.startWait());
    await act(() => result.current.startDelight());
    expect(result.current.beat).toBe('delight');

    // the wait-timeout must not still be armed — advancing time shouldn't move beat again
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });
    expect(result.current.beat).toBe('delight');
  });

  it('nextLoop returns to perform, advances the loop index, resets performCounted/togetherMode, and varies', async () => {
    const { result } = await renderHook(() => useBennyChoreography());
    await act(() => result.current.markPerformed(0));
    await act(() => result.current.startWait());
    await act(() => result.current.childTapped());
    await act(() => result.current.startDelight());

    await act(() => result.current.nextLoop());
    expect(result.current.beat).toBe('perform');
    expect(result.current.loopIndex).toBe(1);
    expect(result.current.performCounted).toEqual([]);
    expect(result.current.togetherMode).toBeNull();
    expect(result.current.variation).toEqual(pickVariation(1));
  });
});
