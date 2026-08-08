import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useLetterIntroduction, { buildQueue, isAtNewLetterSlot } from './useLetterIntroduction';

const mockPlaySound = jest.fn();

jest.mock('./usePhonics', () => ({
  __esModule: true,
  default: () => ({
    playSound: mockPlaySound,
    playWord: jest.fn(),
    playBlend: jest.fn(),
  }),
}));

describe('buildQueue', () => {
  it('appends the current (not-yet-learned) letter after the already-learned ones', () => {
    expect(buildQueue(['s', 'a'], 't')).toEqual(['s', 'a', 't']);
  });

  it('is just the learned letters once nothing new is left to introduce', () => {
    expect(buildQueue(['s', 'a', 't'], null)).toEqual(['s', 'a', 't']);
  });

  it('is a single-item queue for the very first letter', () => {
    expect(buildQueue([], 's')).toEqual(['s']);
  });
});

describe('isAtNewLetterSlot', () => {
  it('is true on the last slot when it holds the current letter', () => {
    expect(isAtNewLetterSlot(['s', 'a', 't'], 2, 't')).toBe(true);
  });

  it('is false anywhere else in the queue', () => {
    expect(isAtNewLetterSlot(['s', 'a', 't'], 0, 't')).toBe(false);
    expect(isAtNewLetterSlot(['s', 'a', 't'], 1, 't')).toBe(false);
  });

  it('is false once every letter is learned (no current letter)', () => {
    expect(isAtNewLetterSlot(['s', 'a', 't'], 2, null)).toBe(false);
  });
});

describe('useLetterIntroduction', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockPlaySound.mockClear();
  });

  it('starts on SATPIN\'s first letter, s', async () => {
    const { result } = await renderHook(() => useLetterIntroduction());
    expect(result.current.letter?.id).toBe('s');
    expect(result.current.revealed).toBe(false);
  });

  it('tapping the letter plays its sound and reveals the picture cue', async () => {
    const { result } = await renderHook(() => useLetterIntroduction());

    await act(() => result.current.handleLetterPress());

    expect(mockPlaySound).toHaveBeenCalledWith('s');
    expect(mockPlaySound).toHaveBeenCalledTimes(1);
    expect(result.current.revealed).toBe(true);
  });

  it('revisits an already-learned letter before showing the next new one', async () => {
    const { result } = await renderHook(() => useLetterIntroduction());
    expect(result.current.letter?.id).toBe('s');

    // Next on the new letter "s" learns it and loops back to revisit it —
    // with only one learned letter, revisiting it IS the whole rotation.
    await act(() => result.current.handleNext());
    expect(result.current.letter?.id).toBe('s');

    // Next again moves past the revisit onto the next new letter, "a".
    await act(() => result.current.handleNext());
    expect(result.current.letter?.id).toBe('a');

    // Learning "a" expands the revisit set to s, a before "t" (new) shows.
    await act(() => result.current.handleNext());
    expect(result.current.letter?.id).toBe('s');
    await act(() => result.current.handleNext());
    expect(result.current.letter?.id).toBe('a');
    await act(() => result.current.handleNext());
    expect(result.current.letter?.id).toBe('t');
  });

  it('keeps the cue revealed while revisiting the same letter, hides it for a new one', async () => {
    const { result } = await renderHook(() => useLetterIntroduction());

    await act(() => result.current.handleLetterPress()); // reveal s's cue
    expect(result.current.revealed).toBe(true);

    await act(() => result.current.handleNext()); // learns s; still displaying s
    expect(result.current.letter?.id).toBe('s');
    expect(result.current.revealed).toBe(true);

    await act(() => result.current.handleNext()); // advances to the new letter, a
    expect(result.current.letter?.id).toBe('a');
    expect(result.current.revealed).toBe(false);
  });

  it('plays the correct sound key at each step as the sequence advances', async () => {
    const { result } = await renderHook(() => useLetterIntroduction());

    await act(() => result.current.handleLetterPress());
    expect(mockPlaySound).toHaveBeenLastCalledWith('s');

    await act(() => result.current.handleNext()); // learns s, revisit -> still s
    await act(() => result.current.handleNext()); // -> new letter a
    expect(result.current.letter?.id).toBe('a');

    await act(() => result.current.handleLetterPress());
    expect(mockPlaySound).toHaveBeenLastCalledWith('a');
  });
});
