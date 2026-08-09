// The Letters activity's own internal modes — distinct from constants/
// activities.ts, which picks between top-level activities (Counting vs
// Letters). This picks between stages *within* Letters
// (LETTERS-VERTICAL-BRIEF.md §2): Stage A (recognition + sound) and Stage B
// (sound matching). Stage C (word building) isn't built yet.

export type LetterStageId = 'practice' | 'soundMatch';

export type LetterStageConfig = {
  id: LetterStageId;
  label: string;
  description: string;
};

export const LETTER_STAGES: LetterStageConfig[] = [
  {
    id: 'practice',
    label: 'Practice',
    description: 'See a letter, hear its sound, tap to explore.',
  },
  {
    id: 'soundMatch',
    label: 'Sound Match',
    description: 'Hear a sound, tap the letter that says it.',
  },
];

export const DEFAULT_LETTER_STAGE_ID: LetterStageId = 'practice';
