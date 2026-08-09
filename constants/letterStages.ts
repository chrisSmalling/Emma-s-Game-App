// The Letters activity's own internal modes — distinct from constants/
// activities.ts, which picks between top-level activities (Counting vs
// Letters). This picks between stages *within* Letters
// (LETTERS-VERTICAL-BRIEF.md §2): Stage A (recognition + sound), Stage B
// (sound matching), and Stage C (word building / blending).

export type LetterStageId = 'practice' | 'soundMatch' | 'wordBuild';

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
  {
    id: 'wordBuild',
    label: 'Word Building',
    description: 'Tap the letters in order to build a word.',
  },
];

export const DEFAULT_LETTER_STAGE_ID: LetterStageId = 'practice';
