// v2: counting subjects beyond the original ocean fish, reusing the same
// tap-order counting engine (hooks/useCounting.ts) with different objects.

export type SubjectId = 'ocean' | 'shapes' | 'colors' | 'letters';

export type SubjectConfig = {
  id: SubjectId;
  label: string;
  description: string;
  // Singular/plural noun for spoken and written lines ("One fish!" / "Three
  // fish!" vs "One shape!" / "Three shapes!") — kept as two explicit fields
  // rather than naive noun + 's' since "fish" is already its own plural.
  noun: string;
  nounPlural: string;
  // Child-facing title/prompt text (icon/audio-only isn't required here —
  // these are short, already-established labels, same pattern as v1).
  title: string;
  prompt: string;
  comingSoon?: boolean;
};

export const SUBJECTS: SubjectConfig[] = [
  {
    id: 'ocean',
    label: 'Ocean Fish',
    description: 'The original — colorful fish swimming in the ocean.',
    noun: 'fish',
    nounPlural: 'fish',
    title: 'Count the fish!',
    prompt: 'Tap each fish once to count it',
  },
  {
    id: 'shapes',
    label: 'Shapes',
    description: 'Circles, squares, triangles, and stars in bright colors.',
    noun: 'shape',
    nounPlural: 'shapes',
    title: 'Count the shapes!',
    prompt: 'Tap each shape once to count it',
  },
  {
    id: 'colors',
    label: 'Colors',
    description: 'Bright solid-color circles.',
    noun: 'color',
    nounPlural: 'colors',
    title: 'Count the colors!',
    prompt: 'Tap each color once to count it',
  },
  {
    id: 'letters',
    label: 'Letters',
    description: 'Big bold letters — A through E.',
    noun: 'letter',
    nounPlural: 'letters',
    title: 'Count the letters!',
    prompt: 'Tap each letter once to count it',
  },
];

export const DEFAULT_SUBJECT_ID: SubjectId = 'ocean';

export function getSubject(id: SubjectId): SubjectConfig {
  return SUBJECTS.find(s => s.id === id) ?? SUBJECTS.find(s => s.id === DEFAULT_SUBJECT_ID)!;
}

// "One fish" vs "Three fish", "One shape" vs "Three shapes".
export function nounForCount(subject: SubjectConfig, count: number): string {
  return count === 1 ? subject.noun : subject.nounPlural;
}
