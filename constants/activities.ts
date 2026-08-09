// Top-level activities in the app — see LETTERS-VERTICAL-BRIEF.md §8: Letters
// is "Vertical #1 of the larger educational app", a sibling to Counting, not
// a subject within it. The ocean world stays the shared home so both
// verticals feel unified (brief §1).
//
// 'benny' (see "Emma's App — Benny's First Magical Slice"): the
// character-first experience layer built on top of the same counting
// engine as 'counting' — Benny's pond, not the bare ocean scene. This is
// the default now: the whole point of the slice is that it's what she
// sees when the app opens. 'counting' and 'letters' stay reachable from
// settings, unchanged underneath.

export type ActivityId = 'benny' | 'counting' | 'letters';

export type ActivityConfig = {
  id: ActivityId;
  label: string;
  description: string;
  comingSoon?: boolean;
};

export const ACTIVITIES: ActivityConfig[] = [
  {
    id: 'benny',
    label: "Benny's Pond",
    description: 'Visit Benny in his forest and count the fish in his pond.',
  },
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

export const DEFAULT_ACTIVITY_ID: ActivityId = 'benny';

export function getActivity(id: ActivityId): ActivityConfig {
  return ACTIVITIES.find(a => a.id === id) ?? ACTIVITIES.find(a => a.id === DEFAULT_ACTIVITY_ID)!;
}
