/**
 * Momentum App Color Theme
 */

const APP_THEME = {
  bgTop: '#0c0e14',
  bgMid: '#12151f',
  bgBottom: '#161a26',
  accent: '#2dd4bf',
  accentMuted: 'rgba(45, 212, 191, 0.22)',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  scrim: ['transparent', 'rgba(0,0,0,0.75)'],
};

export const COLORS = {
  primary: {
    default: '#2dd4bf',
    light: '#5eead4',
    dark: '#14b8a6',
  },
  secondary: {
    default: '#f472b6',
    light: '#fbcfe8',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    tertiary: '#64748b',
    onPrimary: '#042f2e',
  },
  gradient: {
    dark: [APP_THEME.bgTop, APP_THEME.bgBottom],
    primary: ['#2dd4bf', '#14b8a6'],
    secondary: ['#f472b6', '#ec4899'],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  },
  ui: {
    error: '#f87171',
    surface: 'rgba(255, 255, 255, 0.06)',
  },
  workoutHome: APP_THEME,
  app: APP_THEME,
};

export const GRADIENTS = {
  primary: {
    colors: COLORS.gradient.primary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: COLORS.gradient.secondary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  workout: {
    colors: [APP_THEME.bgTop, APP_THEME.bgMid, APP_THEME.bgBottom],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  dark: {
    colors: COLORS.gradient.dark,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  glass: {
    colors: COLORS.gradient.glass,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
};
