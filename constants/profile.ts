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

// Both defined now; only 'en' CONTENT exists (see constants/letters.en.ts
// and constants/wordBuilding.en.ts) — a 'pt' value type-checks everywhere
// already, but every content lookup falls back to English until a
// constants/letters.pt.ts (etc.) is actually written.
export type LanguageCode = 'en' | 'pt';

export type Profile = {
  childName: string;
  // The language spoken around the child day-to-day, vs. the language being
  // taught as "new" to them. Both users of this app get BOTH languages
  // taught — home/learning let the app lean appropriately later (tone,
  // framing, which language explains the other), they do NOT gate content
  // yet. Emma's reality: home 'en', learning 'pt'. The sellable version
  // flips this for a Brazilian customer (home 'pt', learning 'en') — same
  // fields, same engine, no rewrite.
  homeLanguage: LanguageCode;
  learningLanguage: LanguageCode;
  // Which language the UI/content is showing right now. Independent of
  // home/learning (a lesson could show learningLanguage content, or a menu
  // could show homeLanguage chrome) — today it's always 'en' because that's
  // the only language with real content.
  activeLanguage: LanguageCode;
  // Which recorded voice set plays the phonics audio (see
  // hooks/usePhonics.ts) — today there's only ever been one voice, so
  // nothing reads this yet. It's here so a future multi-voice recording
  // structure has a value to key off of from day one.
  activeVoiceId: string;
};

export const DEFAULT_PROFILE: Profile = {
  childName: 'Emma',
  homeLanguage: 'en',
  learningLanguage: 'pt',
  activeLanguage: 'en',
  activeVoiceId: 'parent1',
};

export function getProfile(): Profile {
  return DEFAULT_PROFILE;
}
