import { act, renderHook } from '@testing-library/react-native';
import useSoundMatch, { pickRound } from './useSoundMatch';
import { LettersContent } from '../constants/letters.en';

const mockPlaySound = jest.fn();
jest.mock('./usePhonics', () => ({
  __esModule: true,
  default: () => ({
    playSound: mockPlaySound,
    playWord: jest.fn(),
    playBlend: jest.fn(),
  }),
}));

const mockUseLetters = jest.fn();
jest.mock('./useLetters', () => ({
  __esModule: true,
  default: () => mockUseLetters(),
}));

// The correct-answer chime uses expo-audio's useAudioPlayer hook directly
// (not through usePhonics) — its native module isn't available under Jest,
// so stub it the same way usePhonics itself would be stubbed.
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ seekTo: jest.fn(), play: jest.fn() }),
}));

const fakeContent: LettersContent = {
  languageCode: 'en',
  sets: [{ id: 'set1', label: 'Set 1', letterIds: ['s', 'a', 't'] }],
  letters: {
    s: { id: 's', display: 's', continuous: true, pictureCue: { word: 'snake', emoji: '🐍' } },
    a: { id: 'a', display: 'a', continuous: true, pictureCue: { word: 'apple', emoji: '🍎' } },
    t: { id: 't', display: 't', continuous: false, pictureCue: { word: 'turtle', emoji: '🐢' } },
  },
  words: [],
};

function mockLearned(ids: string[]) {
  mockUseLetters.mockReturnValue({ content: fakeContent, availableForMatching: ids });
}

// A deterministic "random" source: cycles through a fixed sequence of
// [0, 1) values so pickRound's choices are reproducible in tests.
function sequence(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('pickRound', () => {
  it('is null when fewer than two letters are learned', () => {
    expect(pickRound([], null)).toBeNull();
    expect(pickRound(['s'], null)).toBeNull();
  });

  it('offers all learned letters as options when there are exactly two', () => {
    const round = pickRound(['s', 'a'], null, sequence(0));
    expect(round).not.toBeNull();
    expect(round!.optionIds.sort()).toEqual(['a', 's']);
    expect(round!.optionIds).toContain(round!.targetId);
  });

  it('caps options at three even with a larger learned pool', () => {
    const round = pickRound(['s', 'a', 't', 'p', 'i', 'n'], null, sequence(0, 0, 0));
    expect(round).not.toBeNull();
    expect(round!.optionIds).toHaveLength(3);
    expect(new Set(round!.optionIds).size).toBe(3); // no duplicates
    expect(round!.optionIds).toContain(round!.targetId);
  });

  it('avoids repeating the previous target when another letter is available', () => {
    // random() always 0 would pick the first candidate; with "s" excluded
    // from the target pool, the first candidate is "a", not "s".
    const round = pickRound(['s', 'a', 't'], 's', sequence(0));
    expect(round!.targetId).not.toBe('s');
  });
});

describe('useSoundMatch', () => {
  beforeEach(() => {
    mockPlaySound.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('has no round when fewer than two letters are learned', async () => {
    mockLearned(['s']);
    const { result } = await renderHook(() => useSoundMatch());
    expect(result.current.round).toBeNull();
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('starts with a round covering the learned letters, without playing anything yet', async () => {
    mockLearned(['s', 'a', 't']);
    const { result } = await renderHook(() => useSoundMatch());

    expect(result.current.round).not.toBeNull();
    expect(result.current.round!.optionIds).toHaveLength(3);
    expect(result.current.round!.optionIds).toContain(result.current.round!.targetId);
    expect(result.current.phase).toBe('idle');
    // Browsers block audio playback that isn't a direct response to a user
    // gesture — a round appearing (on mount, or after advancing) is not one,
    // so nothing auto-plays; the prompt is only ever heard via playTarget().
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('a correct tap celebrates, then advances to a new round', async () => {
    mockLearned(['s', 'a', 't']);
    const { result } = await renderHook(() => useSoundMatch());
    const targetId = result.current.round!.targetId;

    await act(async () => {
      void result.current.handleOptionPress(targetId);
      await Promise.resolve();
    });
    expect(result.current.phase).toBe('correct');
    expect(result.current.tappedId).toBe(targetId);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1300);
    });
    expect(result.current.phase).toBe('idle');
    expect(result.current.tappedId).toBeNull();
    expect(result.current.round).not.toBeNull();
  });

  it('a wrong tap plays that letter\'s own sound, never fails, and re-invites toward the same target', async () => {
    mockLearned(['s', 'a', 't']);
    const { result } = await renderHook(() => useSoundMatch());
    const round = result.current.round!;
    const wrongId = round.optionIds.find(id => id !== round.targetId)!;

    await act(async () => {
      void result.current.handleOptionPress(wrongId);
      await Promise.resolve();
    });
    expect(result.current.phase).toBe('exploring');
    expect(mockPlaySound).toHaveBeenLastCalledWith(wrongId);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(600);
    });
    expect(result.current.phase).toBe('idle');
    // exploring never reshuffles — same target, same options
    expect(result.current.round).toEqual(round);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(450);
    });
    expect(mockPlaySound).toHaveBeenLastCalledWith(round.targetId);
  });

  it('ignores taps while a previous tap is still resolving', async () => {
    mockLearned(['s', 'a', 't']);
    const { result } = await renderHook(() => useSoundMatch());
    const round = result.current.round!;
    const wrongId = round.optionIds.find(id => id !== round.targetId)!;

    await act(async () => {
      void result.current.handleOptionPress(wrongId);
      await Promise.resolve();
    });
    mockPlaySound.mockClear();

    // A second tap while still 'exploring' should be a no-op.
    await act(async () => {
      void result.current.handleOptionPress(round.targetId);
      await Promise.resolve();
    });
    expect(mockPlaySound).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('exploring');
  });

  it('playTarget replays the current target sound on demand', async () => {
    mockLearned(['s', 'a', 't']);
    const { result } = await renderHook(() => useSoundMatch());
    mockPlaySound.mockClear();

    await act(() => result.current.playTarget());
    expect(mockPlaySound).toHaveBeenCalledWith(result.current.round!.targetId);
  });
});
