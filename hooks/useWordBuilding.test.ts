import { act, renderHook } from '@testing-library/react-native';
import useWordBuilding, { scrambleLetters, wordContentForLanguage } from './useWordBuilding';
import WORD_BUILDING_EN, { WordBuildingContent } from '../constants/wordBuilding.en';
import * as profileModule from '../constants/profile';

const mockPlaySound = jest.fn();
const mockPlayWord = jest.fn();
const mockPlayBlend = jest.fn();
jest.mock('./usePhonics', () => ({
  __esModule: true,
  default: () => ({
    playSound: mockPlaySound,
    playWord: mockPlayWord,
    playBlend: mockPlayBlend,
  }),
}));

// A deterministic "random" source: cycles through a fixed sequence of
// [0, 1) values so scrambleLetters's shuffle is reproducible in tests.
function sequence(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

const oneWordContent: WordBuildingContent = {
  languageCode: 'en',
  words: [{ word: 'sat', letters: ['s', 'a', 't'], pictureCue: { emoji: '🪑' } }],
};

const twoWordContent: WordBuildingContent = {
  languageCode: 'en',
  words: [
    { word: 'sat', letters: ['s', 'a', 't'], pictureCue: { emoji: '🪑' } },
    { word: 'pin', letters: ['p', 'i', 'n'], pictureCue: { emoji: '📌' } },
  ],
};

describe('scrambleLetters', () => {
  it('contains exactly the same letters, just reordered', () => {
    const result = scrambleLetters(['s', 'a', 't'], sequence(0));
    expect(result.sort()).toEqual(['a', 's', 't']);
  });

  it('is deterministic given the same random source', () => {
    // Constant-0 random on ['s','a','t'] (Fisher-Yates from the end):
    // swap(2,0) -> [t,a,s], then swap(1,0) -> [a,t,s].
    expect(scrambleLetters(['s', 'a', 't'], sequence(0))).toEqual(['a', 't', 's']);
  });
});

describe('wordContentForLanguage', () => {
  it('selects the English content for "en"', () => {
    expect(wordContentForLanguage('en')).toBe(WORD_BUILDING_EN);
  });

  it('falls back to English for a language with no content yet', () => {
    expect(wordContentForLanguage('pt')).toBe(WORD_BUILDING_EN);
  });
});

describe('useWordBuilding', () => {
  beforeEach(() => {
    mockPlaySound.mockClear();
    mockPlayWord.mockClear();
    mockPlayBlend.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts on the first word, scrambled, nothing placed, nothing played', async () => {
    const { result } = await renderHook(() => useWordBuilding(oneWordContent, sequence(0)));

    expect(result.current.word?.word).toBe('sat');
    expect(result.current.scrambled).toEqual(['a', 't', 's']);
    expect(result.current.placedCount).toBe(0);
    expect(result.current.placedTileIndices).toEqual([]);
    expect(result.current.tapPhase).toBe('idle');
    expect(result.current.roundPhase).toBe('building');
    expect(mockPlaySound).not.toHaveBeenCalled();
    expect(mockPlayWord).not.toHaveBeenCalled();
  });

  it('reads the active language from the profile when picking default content and letters', async () => {
    const spy = jest.spyOn(profileModule, 'getProfile');
    await renderHook(() => useWordBuilding(undefined, sequence(0)));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('playPrompt plays the current word', async () => {
    const { result } = await renderHook(() => useWordBuilding(oneWordContent, sequence(0)));
    await act(() => result.current.playPrompt());
    expect(mockPlayWord).toHaveBeenCalledWith('sat');
  });

  it('tapping a not-yet-expected letter plays its own sound, never advances, never fails', async () => {
    // scrambled = ['a','t','s']; word.letters = ['s','a','t'], so 's' (index 2) is
    // expected first — tapping index 0 ('a') is out of order.
    const { result } = await renderHook(() => useWordBuilding(oneWordContent, sequence(0)));

    await act(async () => {
      void result.current.handleTilePress(0);
      await Promise.resolve();
    });
    expect(result.current.tapPhase).toBe('exploring');
    expect(mockPlaySound).toHaveBeenLastCalledWith('a');
    expect(result.current.placedCount).toBe(0);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(600);
    });
    expect(result.current.tapPhase).toBe('idle');
    expect(result.current.placedCount).toBe(0);
    expect(result.current.placedTileIndices).toEqual([]);
    expect(mockPlayBlend).not.toHaveBeenCalled();
  });

  it('tapping the correct next letter places it in order and advances', async () => {
    const { result } = await renderHook(() => useWordBuilding(oneWordContent, sequence(0)));

    await act(async () => {
      void result.current.handleTilePress(2); // 's', the first expected letter
      await Promise.resolve();
    });
    expect(result.current.tapPhase).toBe('correct');
    expect(mockPlaySound).toHaveBeenLastCalledWith('s');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });
    expect(result.current.tapPhase).toBe('idle');
    expect(result.current.placedCount).toBe(1);
    expect(result.current.placedTileIndices).toEqual([2]);
    expect(result.current.roundPhase).toBe('building');
  });

  it('ignores taps while a previous tap is still resolving', async () => {
    const { result } = await renderHook(() => useWordBuilding(oneWordContent, sequence(0)));

    await act(async () => {
      void result.current.handleTilePress(0); // wrong letter, starts resolving
      await Promise.resolve();
    });
    mockPlaySound.mockClear();

    await act(async () => {
      void result.current.handleTilePress(2); // correct letter, but round is busy
      await Promise.resolve();
    });
    expect(mockPlaySound).not.toHaveBeenCalled();
    expect(result.current.placedCount).toBe(0);
  });

  it('completing the word plays the blend, celebrates, then advances to the next word', async () => {
    const { result } = await renderHook(() => useWordBuilding(twoWordContent, sequence(0)));

    // scrambled('sat') with constant-0 random = ['a','t','s']; place in order
    // s(2) -> a(0) -> t(1).
    for (const tileIndex of [2, 0, 1]) {
      await act(async () => {
        void result.current.handleTilePress(tileIndex);
        await Promise.resolve();
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(500);
      });
    }

    // The final tile's placement flips roundPhase immediately...
    expect(result.current.roundPhase).toBe('celebrating');
    expect(result.current.placedCount).toBe(3);
    expect(mockPlayBlend).not.toHaveBeenCalled(); // not yet — the beat hasn't elapsed

    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });
    expect(mockPlayBlend).toHaveBeenCalledWith(['s', 'a', 't'], 'sat');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2200);
    });
    expect(result.current.roundPhase).toBe('building');
    expect(result.current.word?.word).toBe('pin');
    expect(result.current.placedCount).toBe(0);
    expect(result.current.placedTileIndices).toEqual([]);
  });

  it('a single-word list loops back to the same word', async () => {
    const { result } = await renderHook(() => useWordBuilding(oneWordContent, sequence(0)));

    for (const tileIndex of [2, 0, 1]) {
      await act(async () => {
        void result.current.handleTilePress(tileIndex);
        await Promise.resolve();
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(500);
      });
    }
    await act(async () => {
      await jest.advanceTimersByTimeAsync(300 + 2200);
    });

    expect(result.current.word?.word).toBe('sat');
    expect(result.current.placedCount).toBe(0);
    expect(result.current.roundPhase).toBe('building');
  });
});
