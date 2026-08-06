// Real-world bridge prompts: every round closes by pointing counting back at
// real objects near the child, per the spec's "bridge to the real world" rule.
export const BRIDGE_PROMPTS = [
  'Now count your fingers!',
  'How many toes do you have?',
  'Can you count your toys?',
  'How many buttons on your shirt?',
  'Count the stairs with me!',
];

export function bridgePromptForRound(round: number): string {
  return BRIDGE_PROMPTS[(round - 1) % BRIDGE_PROMPTS.length];
}

// Co-play hook: addresses the grown-up, not the child, to invite them in.
export const COPLAY_HINT = 'Grown-up: count out loud together!';

export const NOUN = 'fish';
