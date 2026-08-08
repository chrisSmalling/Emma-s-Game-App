// Top-level activities in the app — see LETTERS-VERTICAL-BRIEF.md §8: Letters
// is "Vertical #1 of the larger educational app", a sibling to Counting, not
// a subject within it. The ocean world stays the shared home so both
// verticals feel unified (brief §1).

export type ActivityId = 'counting' | 'letters';

export type ActivityConfig = {
  id: ActivityId;
  label: string;
  description: string;
  comingSoon?: boolean;
};

export const ACTIVITIES: ActivityConfig[] = [
  {
    id: 'counting',
    label: 'Counting',
    description: 'Tap and count fish, shapes, colors, and letter shapes.',
  },
  {
    id: 'letters',
    label: 'Letters',
    description: 'Learn letter sounds, starting with s, a, t, p, i, n.',
  },
];

export const DEFAULT_ACTIVITY_ID: ActivityId = 'counting';

export function getActivity(id: ActivityId): ActivityConfig {
  return ACTIVITIES.find(a => a.id === id) ?? ACTIVITIES.find(a => a.id === DEFAULT_ACTIVITY_ID)!;
}
