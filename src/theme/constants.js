import { StyleSheet } from 'react-native';
import { COLORS as THEME } from './colors';

const APP = THEME.app;

/** Merged theme for authStyles + legacy commonStyles */
export const COLORS = {
  ...THEME,
  primary: {
    default: APP.accent,
    light: '#5eead4',
    dark: '#0d9488',
  },
  text: {
    primary: APP.text,
    secondary: APP.textMuted,
    tertiary: APP.textDim,
    onPrimary: '#0c0e14',
  },
  ui: {
    error: '#f87171',
    success: APP.accent,
    warning: '#fbbf24',
    surface: 'rgba(255,255,255,0.06)',
  },
  gradient: {
    dark: [APP.bgTop, APP.bgBottom],
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
};

export const SHADOWS = StyleSheet.create({
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 6,
  },
});
