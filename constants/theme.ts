// Locked palette — see DESIGN-BRIEF.md. Do not hardcode these colors
// anywhere else; import COLORS instead.
export const COLORS = {
  deepWater: '#0A4D6E', // gradient bottom
  midWater: '#1B98D5',
  surfaceWater: '#7FD8F7', // gradient top
  sand: '#F4E4C1',
  counted: '#34D1A6',
  celebration: '#FFD34E',
  accent: '#FF8A5B',
  fish: ['#FF9F43', '#FF6B9D', '#FFD34E'] as const,

  // Benny's forest world (the character-first slice) — warm and calm,
  // deliberately distinct from the ocean's cool blues so the two worlds
  // read as different places, same visual language (soft, rounded, Fredoka).
  forestSky: '#FFE8B8', // gradient top — warm dappled light
  forestCanopy: '#6FA25E', // gradient mid — leafy green
  forestDeep: '#2F5233', // gradient bottom — mossy shade
  forestFloor: '#8B6F47', // warm soil/bark brown
  forestGlow: '#FFD9A0', // sunbeam / warm highlight
  bennyFur: '#A9744F', // Benny's fur
  bennyFurLight: '#D9AE82', // snout/belly/inner-ear fur
  bennyScarf: '#E8604C', // Benny's scarf
} as const;

// Apply alpha to a locked palette token instead of hand-writing rgba(...).
export function withOpacity(hex: string, opacity: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

export const TYPE = {
  largeTitle: 36,
  title: 24,
  body: 16,
  small: 14,
  // @expo-google-fonts registers each weight as its own family name — there is
  // no single "Fredoka" family to combine with fontWeight. Pick the right one.
  fontFamily: 'Fredoka_400Regular',
  fontFamilySemiBold: 'Fredoka_600SemiBold',
  fontFamilyBold: 'Fredoka_700Bold',
} as const;

export const MOTION = {
  spring: {
    damping: 12,
    stiffness: 120,
    mass: 1,
  },
  bubble: {
    // default bubble rise duration in ms and horizontal drift in px
    duration: 4000,
    drift: 20,
    stagger: 300,
  },
  celebration: {
    // expected Lottie length (ms) and a gentle timing token
    duration: 3000,
  },
} as const;

const THEME = {
  COLORS,
  SPACING,
  TYPE,
  MOTION,
  withOpacity,
};

export default THEME;
