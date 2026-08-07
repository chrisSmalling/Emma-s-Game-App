// v2: a difficulty scaffold mapping onto the developmental counting ladder
// from spec.md §4 (Gelman & Gallistel's counting principles).

export type LevelId = 'rote' | 'oneToOne' | 'cardinality' | 'subitizing';

export type LevelConfig = {
  id: LevelId;
  label: string;
  description: string;
  // Rounds cycle 1..maxCount, matching the age-appropriate range for the
  // developmental stage (spec.md §4).
  maxCount: number;
  // Level 3+: the round-complete moment asks "how many?" before answering,
  // instead of just stating the total — leans harder into cardinality.
  emphasizeCardinality: boolean;
  // Subitizing: each round opens with a brief, non-interactive "peek" at
  // the whole set (encouraging an instant glance) before it becomes the
  // normal tap-to-count round. No quiz, no right/wrong answer — spec.md's
  // "no fail state" rule rules out a graded guess. See hooks/useCounting.ts.
  peek?: boolean;
  comingSoon?: boolean;
};

export const LEVELS: LevelConfig[] = [
  {
    id: 'rote',
    label: 'Rote Counting',
    description: 'Ages ~2. Counts 1 to 3 — the voice models every number as your child taps.',
    maxCount: 3,
    emphasizeCardinality: false,
  },
  {
    id: 'oneToOne',
    label: 'One-to-One',
    description: 'Ages ~3. Counts 1 to 5 — one tap, one number, exactly once.',
    maxCount: 5,
    emphasizeCardinality: false,
  },
  {
    id: 'cardinality',
    label: 'Cardinality',
    description: 'Ages 2–4. Counts 1 to 5, with extra emphasis on "how many in total?"',
    maxCount: 5,
    emphasizeCardinality: true,
  },
  {
    id: 'subitizing',
    label: 'Subitizing',
    description: 'Ages ~4–5. A quick peek at the whole set first, then count together to check.',
    maxCount: 5,
    emphasizeCardinality: true,
    peek: true,
  },
];

export const DEFAULT_LEVEL_ID: LevelId = 'oneToOne';

export function getLevel(id: LevelId): LevelConfig {
  return LEVELS.find(l => l.id === id) ?? LEVELS.find(l => l.id === DEFAULT_LEVEL_ID)!;
}
