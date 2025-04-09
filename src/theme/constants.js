import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: {
    light: '#3498db',
    default: '#2980b9',
    dark: '#1c6ea4',
  },
  text: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    tertiary: '#95a5a6',
    onPrimary: '#ffffff',
  },
  ui: {
    error: '#e74c3c',
    success: '#2ecc71',
    warning: '#f1c40f',
  },
  gradient: {
    dark: ['#2c3e50', '#3498db'],
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
    shadowOpacity: 0.30,
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