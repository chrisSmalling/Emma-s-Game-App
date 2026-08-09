// Child/Family Profile — Seam A of the personalization roadmap.
//
// A single source of truth for child- and family-level values, so future
// personalization, multi-voice, and bilingual features fill in this
// structure instead of forcing a rewrite. Pure structure for now: no UI, no
// persistence, no new behavior — just centralizing values the app already
// uses (or will trivially need) behind one typed accessor.
//
// getProfile() is the seam: every read in the app goes through it, so a
// future profile screen / AsyncStorage-backed store can replace
// DEFAULT_PROFILE with a real, editable, persisted profile without any
// caller changing.

// Widens to 'en' | 'pt' (etc.) once a second language's content exists —
// see constants/letters.en.ts and constants/wordBuilding.en.ts.
export type LanguageCode = 'en';

export type Profile = {
  childName: string;
  activeLanguage: LanguageCode;
  // Which recorded voice set plays the phonics audio (see
  // hooks/usePhonics.ts) — today there's only ever been one voice, so
  // nothing reads this yet. It's here so a future multi-voice recording
  // structure has a value to key off of from day one.
  activeVoiceId: string;
};

export const DEFAULT_PROFILE: Profile = {
  childName: 'Emma',
  activeLanguage: 'en',
  activeVoiceId: 'parent1',
};

export function getProfile(): Profile {
  return DEFAULT_PROFILE;
}
