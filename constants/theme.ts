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
} as const;

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
};

export default THEME;
