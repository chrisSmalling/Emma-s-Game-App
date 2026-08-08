// Real-world bridge prompts: every round closes by pointing counting back at
// real objects near the child, per the spec's "bridge to the real world" rule.
// Kept to things a child can always act on right where they are — no prompt
// assumes a specific object or place they may not have.
export const BRIDGE_PROMPTS = [
  'Now count your fingers!',
  'Can you count your toes?',
  'Count them again with me!',
  'How many can you find in the room?',
];

export function bridgePromptForRound(round: number): string {
  return BRIDGE_PROMPTS[(round - 1) % BRIDGE_PROMPTS.length];
}

// Co-play hook: addresses the grown-up, not the child, to invite them in.
export const COPLAY_HINT = 'Grown-up: count out loud together!';

// Same co-play pattern, for the Letters vertical's Stage A screen.
export const LETTERS_COPLAY_HINT = 'Grown-up: say the sound together!';

// Same co-play pattern, for the Letters vertical's Stage B (sound-matching) screen.
export const SOUND_MATCH_COPLAY_HINT = 'Grown-up: help her listen for the sound!';
