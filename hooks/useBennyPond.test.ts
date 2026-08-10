import { act, renderHook } from '@testing-library/react-native';
import useBennyPond from './useBennyPond';
import { pickVariation } from './useBennyChoreography';

// useBennyChoreography is NOT mocked — it's already independently tested
// (useBennyChoreography.test.ts), and using the real thing here verifies
// useBennyPond actually orchestrates around it correctly, not just around
// an idealized mock.

const mockPlayGreeting = jest.fn();
const mockPlayCount = jest.fn();
const mockPlayLine = jest.fn();
const mockPlayCelebrate = jest.fn();
jest.mock('./useBennyVoice', () => ({
  __esModule: true,
  default: () => ({
    playGreeting: mockPlayGreeting,
    playCount: mockPlayCount,
    playLine: mockPlayLine,
    playCelebrate: mockPlayCelebrate,
  }),
}));

jest.mock('../constants/profile', () => ({
  getProfile: () => ({ childName: 'Emma', activeLanguage: 'en', homeLanguage: 'en', learningLanguage: 'pt', activeVoiceId: 'parent1' }),
}));

// A small stateful stand-in for useCounting — real enough to exercise
// useBennyPond's repeated tapItem calls (the Benny-helps fallback taps
// several times in a row) correctly, via a getter so `.items` always
// reflects the latest tap rather than a stale snapshot.
function makeCountingMock(itemCount: number, overrides: Record<string, unknown> = {}) {
  let items = Array.from({ length: itemCount }, (_, i) => ({ id: i, counted: false, order: null as number | null }));
  let countedCount = 0;
  const tapItem = jest.fn((index: number) => {
    const it = items[index];
    if (!it) return null;
    if (it.counted) return { assignedOrder: it.order, isNew: false };
    const assignedOrder = countedCount + 1;
    items = items.map((x, i) => (i === index ? { ...x, counted: true, order: assignedOrder } : x));
    countedCount = assignedOrder;
    return { assignedOrder, isNew: true };
  });
  const nextRound = jest.fn();
  const restartSession = jest.fn();
  return {
    round: 1,
    roundsPerSession: 5,
    get items() {
      return items;
    },
    countedCount: 0,
    phase: 'playing',
    highestCountReached: 0,
    level: {},
    levelId: 'oneToOne',
    setLevel: jest.fn(),
    subject: {},
    subjectId: 'ocean',
    setSubject: jest.fn(),
    tapItem,
    endPeek: jest.fn(),
    nextRound,
    restartSession,
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockCountingState: any;
jest.mock('./useCounting', () => ({
  __esModule: true,
  default: () => mockCountingState,
}));

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe('useBennyPond', () => {
  beforeEach(() => {
    mockPlayGreeting.mockClear();
    mockPlayCount.mockClear();
    mockPlayLine.mockClear();
    mockPlayCelebrate.mockClear();
    mockCountingState = makeCountingMock(2);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts ungreeted, curious, plays the greeting once', async () => {
    const { result } = await renderHook(() => useBennyPond());
    expect(result.current.greeted).toBe(false);
    expect(result.current.bennyState).toBe('curious');
    expect(result.current.childName).toBe('Emma');
    expect(mockPlayGreeting).toHaveBeenCalledTimes(1);
  });

  it('auto-advances past the greeting and starts loop 0\'s perform beat', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await advance(2800); // greeting timeout
    expect(result.current.greeted).toBe(true);
    expect(result.current.beat).toBe('perform');
    expect(result.current.variation).toEqual(pickVariation(0));
  });

  it('advanceFromGreeting skips straight past the greeting', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    expect(result.current.greeted).toBe(true);
  });

  it('the perform sequence narrates the opener, counts every fish, says wow, invites, then waits', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());

    // opener -> BEAT_MS -> count(1) -> STEP -> count(2) -> STEP -> wow -> BEAT_MS -> invite -> SHORT_BEAT -> wait
    await advance(500 + 750 + 750 + 500 + 400 + 100);

    expect(mockPlayLine).toHaveBeenNthCalledWith(1, 'perform_open_1');
    expect(mockPlayCount).toHaveBeenNthCalledWith(1, 1);
    expect(mockPlayCount).toHaveBeenNthCalledWith(2, 2);
    expect(mockPlayLine).toHaveBeenNthCalledWith(2, 'perform_wow');
    expect(mockPlayLine).toHaveBeenNthCalledWith(3, 'invite');
    expect(result.current.beat).toBe('wait');
    expect(result.current.performCounted).toEqual([0, 1]);
    expect(result.current.fishInteractive).toBe(true);
    // the real round underneath is untouched — this was all a visual performance
    expect(mockCountingState.tapItem).not.toHaveBeenCalled();
  });

  it('a tap during wait counts along with her and settles back to happy on a non-completing tap', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    await advance(500 + 750 + 750 + 500 + 400 + 100);
    expect(result.current.beat).toBe('wait');

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    expect(result.current.beat).toBe('together');
    expect(result.current.bennyState).toBe('countingAlong');
    expect(mockPlayCount).toHaveBeenLastCalledWith(1);

    await advance(700);
    expect(result.current.bennyState).toBe('happy');
    expect(result.current.beat).toBe('together'); // round isn't done yet (2 fish)
  });

  it('the completing tap moves straight to delight', async () => {
    mockCountingState = makeCountingMock(1);
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    await advance(500 + 750 + 500 + 400 + 100); // only 1 fish this loop

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    expect(result.current.beat).toBe('delight');
  });

  it('if she never taps, Benny warmly finishes the round himself and reaches delight', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    await advance(500 + 750 + 750 + 500 + 400 + 100);
    expect(result.current.beat).toBe('wait');

    mockPlayLine.mockClear();
    mockPlayCount.mockClear();

    // let the wait timeout elapse with zero taps
    await advance(4500);
    expect(result.current.beat).toBe('together');

    // together line -> BEAT_MS -> tap+count(1) -> STEP -> tap+count(2) -> STEP -> delight
    await advance(500 + 750 + 750 + 100);

    expect(mockPlayLine).toHaveBeenCalledWith('together');
    expect(mockCountingState.tapItem).toHaveBeenCalledWith(0);
    expect(mockCountingState.tapItem).toHaveBeenCalledWith(1);
    expect(mockPlayCount).toHaveBeenCalledWith(1);
    expect(mockPlayCount).toHaveBeenCalledWith(2);
    expect(result.current.beat).toBe('delight');
  });

  it('taps during the perform beat (before invite) do nothing', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    expect(result.current.beat).toBe('perform');

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    expect(mockCountingState.tapItem).not.toHaveBeenCalled();
    expect(result.current.beat).toBe('perform');
  });

  it('delight celebrates, advances the round, and starts a varied next loop', async () => {
    mockCountingState = makeCountingMock(1);
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    await advance(500 + 750 + 500 + 400 + 100);

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    expect(result.current.beat).toBe('delight');
    expect(result.current.bennyState).toBe('proud');

    await advance(300 + 2600 + 100);
    expect(mockPlayCelebrate).toHaveBeenCalledTimes(1);
    expect(mockCountingState.nextRound).toHaveBeenCalledTimes(1);
    expect(mockCountingState.restartSession).not.toHaveBeenCalled();

    expect(result.current.beat).toBe('perform');
    expect(result.current.variation).toEqual(pickVariation(1));
  });

  it('loops via restartSession when delight happens on the last round', async () => {
    mockCountingState = makeCountingMock(1, { round: 5, roundsPerSession: 5 });
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    await advance(500 + 750 + 500 + 400 + 100);

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    await advance(300 + 2600 + 100);

    expect(mockCountingState.restartSession).toHaveBeenCalledTimes(1);
    expect(mockCountingState.nextRound).not.toHaveBeenCalled();
  });
});
