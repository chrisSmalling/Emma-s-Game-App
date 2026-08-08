import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useLetters, {
  flattenSequence,
  learnedLetters,
  nextLetterToIntroduce,
  playableWords,
  setIdForLetter,
} from './useLetters';
import LETTERS_EN, { LettersContent } from '../constants/letters.en';

// A tiny fake content fixture for isolated, fast progression tests — the
// engine must not assume English/SATPIN, so exercising it against a
// different sequence entirely is the real test of that.
const fakeContent: LettersContent = {
  languageCode: 'en',
  sets: [
    { id: 'setA', label: 'Set A', letterIds: ['x', 'y'] },
    { id: 'setB', label: 'Set B', letterIds: ['z'] },
  ],
  letters: {
    x: { id: 'x', display: 'x', continuous: false, pictureCue: { word: 'xray', emoji: '' } },
    y: { id: 'y', display: 'y', continuous: false, pictureCue: { word: 'yak', emoji: '' } },
    z: { id: 'z', display: 'z', continuous: false, pictureCue: { word: 'zebra', emoji: '' } },
  },
  words: [
    { word: 'xy', letters: ['x', 'y'], setId: 'setA' },
    { word: 'xyz', letters: ['x', 'y', 'z'], setId: 'setB' },
  ],
};

describe('pure sequence helpers', () => {
  it('flattenSequence concatenates every set in order', () => {
    expect(flattenSequence(fakeContent)).toEqual(['x', 'y', 'z']);
  });

  it('setIdForLetter finds the owning set', () => {
    expect(setIdForLetter(fakeContent, 'x')).toBe('setA');
    expect(setIdForLetter(fakeContent, 'z')).toBe('setB');
  });

  it('nextLetterToIntroduce is the first not-yet-learned letter in sequence order', () => {
    expect(nextLetterToIntroduce(fakeContent, [])).toBe('x');
    expect(nextLetterToIntroduce(fakeContent, ['x'])).toBe('y');
    expect(nextLetterToIntroduce(fakeContent, ['x', 'y', 'z'])).toBeNull();
  });

  it('learnedLetters filters to only learned, keeping sequence order', () => {
    expect(learnedLetters(fakeContent, ['z', 'x'])).toEqual(['x', 'z']);
  });

  it('playableWords requires every letter in the word to be learned', () => {
    expect(playableWords(fakeContent, ['x'])).toEqual([]);
    expect(playableWords(fakeContent, ['x', 'y'])).toEqual([{ word: 'xy', letters: ['x', 'y'], setId: 'setA' }]);
    expect(playableWords(fakeContent, ['x', 'y', 'z'])).toHaveLength(2);
  });
});

describe('useLetters', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts with nothing learned and the first letter in sequence as current', async () => {
    const { result } = await renderHook(() => useLetters(fakeContent));
    expect(result.current.learnedIds).toEqual([]);
    expect(result.current.currentLetterId).toBe('x');
    expect(result.current.currentSetId).toBe('setA');
  });

  it('defaults to the real English content, starting at SATPIN\'s first letter', async () => {
    const { result } = await renderHook(() => useLetters());
    expect(result.current.content).toBe(LETTERS_EN);
    expect(result.current.currentLetterId).toBe('s');
  });

  it('markLearned advances currentLetterId to the next in sequence', async () => {
    const { result } = await renderHook(() => useLetters(fakeContent));

    await act(() => result.current.markLearned('x'));
    expect(result.current.learnedIds).toEqual(['x']);
    expect(result.current.currentLetterId).toBe('y');

    await act(() => result.current.markLearned('y'));
    expect(result.current.currentLetterId).toBe('z');
    expect(result.current.currentSetId).toBe('setB');
  });

  it('marking the last letter learned sets currentLetterId to null', async () => {
    const { result } = await renderHook(() => useLetters(fakeContent));
    await act(() => result.current.markLearned('x'));
    await act(() => result.current.markLearned('y'));
    await act(() => result.current.markLearned('z'));
    expect(result.current.currentLetterId).toBeNull();
  });

  it('markLearned is idempotent — marking the same letter twice does not duplicate it', async () => {
    const { result } = await renderHook(() => useLetters(fakeContent));
    await act(() => result.current.markLearned('x'));
    await act(() => result.current.markLearned('x'));
    expect(result.current.learnedIds).toEqual(['x']);
  });

  it('availableForMatching and availableWords track learned letters', async () => {
    const { result } = await renderHook(() => useLetters(fakeContent));
    await act(() => result.current.markLearned('x'));
    await act(() => result.current.markLearned('y'));

    expect(result.current.availableForMatching).toEqual(['x', 'y']);
    expect(result.current.availableWords.map(w => w.word)).toEqual(['xy']);
  });

  it('resetProgress clears learned letters back to empty', async () => {
    const { result } = await renderHook(() => useLetters(fakeContent));
    await act(() => result.current.markLearned('x'));
    await act(() => result.current.resetProgress());
    expect(result.current.learnedIds).toEqual([]);
    expect(result.current.currentLetterId).toBe('x');
  });

  it('persists learned progress across a remount', async () => {
    const first = await renderHook(() => useLetters(fakeContent));
    await act(() => first.result.current.markLearned('x'));
    await act(() => first.unmount());

    const second = await renderHook(() => useLetters(fakeContent));
    // The AsyncStorage restore in the mount effect resolves over a few
    // microtask hops — poll rather than guess a fixed number of ticks.
    await waitFor(() => {
      expect(second.result.current.learnedIds).toEqual(['x']);
    });
  });
});
