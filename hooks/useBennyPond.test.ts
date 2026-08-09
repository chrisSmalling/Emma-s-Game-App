import { act, renderHook } from '@testing-library/react-native';
import useBennyPond from './useBennyPond';

const mockTapItem = jest.fn();
const mockNextRound = jest.fn();
const mockRestartSession = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockCountingState: any;

jest.mock('./useCounting', () => ({
  __esModule: true,
  default: () => mockCountingState,
}));

const mockPlayGreeting = jest.fn();
const mockPlayCount = jest.fn();
const mockPlayPraise = jest.fn();
jest.mock('./useBennyVoice', () => ({
  __esModule: true,
  default: () => ({
    playGreeting: mockPlayGreeting,
    playCount: mockPlayCount,
    playPraise: mockPlayPraise,
  }),
}));

jest.mock('../constants/profile', () => ({
  getProfile: () => ({ childName: 'Emma', activeLanguage: 'en', homeLanguage: 'en', learningLanguage: 'pt', activeVoiceId: 'parent1' }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCountingState(overrides: Record<string, any> = {}) {
  return {
    round: 1,
    roundsPerSession: 5,
    items: [
      { id: 0, counted: false, order: null },
      { id: 1, counted: false, order: null },
    ],
    countedCount: 0,
    phase: 'playing',
    highestCountReached: 0,
    level: {},
    levelId: 'oneToOne',
    setLevel: jest.fn(),
    subject: {},
    subjectId: 'ocean',
    setSubject: jest.fn(),
    tapItem: mockTapItem,
    endPeek: jest.fn(),
    nextRound: mockNextRound,
    restartSession: mockRestartSession,
    ...overrides,
  };
}

describe('useBennyPond', () => {
  beforeEach(() => {
    mockTapItem.mockReset();
    mockNextRound.mockClear();
    mockRestartSession.mockClear();
    mockPlayGreeting.mockClear();
    mockPlayCount.mockClear();
    mockPlayPraise.mockClear();
    mockCountingState = makeCountingState();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts on the greeting, curious, and plays the greeting once', async () => {
    const { result } = await renderHook(() => useBennyPond());
    expect(result.current.stage).toBe('greeting');
    expect(result.current.bennyState).toBe('curious');
    expect(result.current.childName).toBe('Emma');
    expect(mockPlayGreeting).toHaveBeenCalledTimes(1);
  });

  it('auto-advances to counting after the greeting beat', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2800);
    });
    expect(result.current.stage).toBe('counting');
    expect(result.current.bennyState).toBe('happy');
  });

  it('advanceFromGreeting skips straight to counting, and the later timer is a no-op', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());
    expect(result.current.stage).toBe('counting');
    expect(result.current.bennyState).toBe('happy');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2800);
    });
    expect(result.current.stage).toBe('counting');
  });

  it('ignores fish taps during the greeting', async () => {
    const { result } = await renderHook(() => useBennyPond());
    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    expect(mockTapItem).not.toHaveBeenCalled();
  });

  it('a non-completing tap plays its count, goes countingAlong, then settles to happy', async () => {
    mockTapItem.mockReturnValue({ assignedOrder: 1, isNew: true });
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    expect(result.current.bennyState).toBe('countingAlong');
    expect(mockPlayCount).toHaveBeenCalledWith(1);
    expect(result.current.stage).toBe('counting');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(700);
    });
    expect(result.current.bennyState).toBe('happy');
  });

  it('the completing tap celebrates, praises, then loops into a fresh round', async () => {
    mockTapItem.mockReturnValue({ assignedOrder: 2, isNew: true }); // items has length 2
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());

    await act(async () => {
      void result.current.handleFishTap(1);
      await Promise.resolve();
    });
    expect(result.current.stage).toBe('celebrating');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });
    expect(result.current.bennyState).toBe('proud');
    expect(mockPlayPraise).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2600);
    });
    expect(mockNextRound).toHaveBeenCalledTimes(1);
    expect(mockRestartSession).not.toHaveBeenCalled();
    expect(result.current.stage).toBe('counting');
    expect(result.current.bennyState).toBe('happy');
  });

  it('loops via restartSession when the completing tap is the last round', async () => {
    mockCountingState = makeCountingState({ round: 5, roundsPerSession: 5, items: [{ id: 0, counted: false, order: null }] });
    mockTapItem.mockReturnValue({ assignedOrder: 1, isNew: true });
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(300 + 2600);
    });
    expect(mockRestartSession).toHaveBeenCalledTimes(1);
    expect(mockNextRound).not.toHaveBeenCalled();
  });

  it('a re-tap of an already-counted fish is not treated as round-completing', async () => {
    mockTapItem.mockReturnValue({ assignedOrder: 1, isNew: false });
    const { result } = await renderHook(() => useBennyPond());
    await act(() => result.current.advanceFromGreeting());

    await act(async () => {
      void result.current.handleFishTap(0);
      await Promise.resolve();
    });
    expect(result.current.stage).toBe('counting');
    expect(mockPlayPraise).not.toHaveBeenCalled();
  });
});
