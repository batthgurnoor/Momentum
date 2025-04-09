/**
 * Momentum App Typography
 * This file defines all the text styles used in the app.
 */

import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

// Font multiplier based on device size (can be dynamic in a more advanced implementation)
const fontScale = 1;

export const FONTS = {
  // Regular Lato font
  regular: 'Lato_400Regular',
  // Bold Lato font
  bold: 'Lato_700Bold',
};

export const FONT_SIZES = {
  xs: 12 * fontScale,
  sm: 14 * fontScale,
  md: 16 * fontScale,
  lg: 18 * fontScale,
  xl: 20 * fontScale,
  '2xl': 24 * fontScale,
  '3xl': 30 * fontScale,
  '4xl': 36 * fontScale,
  '5xl': 48 * fontScale,
};

export const LINE_HEIGHTS = {
  xs: 16 * fontScale,
  sm: 20 * fontScale,
  md: 24 * fontScale,
  lg: 28 * fontScale,
  xl: 32 * fontScale,
  '2xl': 36 * fontScale,
  '3xl': 40 * fontScale,
};

// Typography styles to use throughout the app
export const TYPOGRAPHY = StyleSheet.create({
  // Headings
  h1: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: LINE_HEIGHTS['3xl'],
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['3xl'],
    lineHeight: LINE_HEIGHTS['2xl'],
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  h3: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: LINE_HEIGHTS.xl,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  h4: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    lineHeight: LINE_HEIGHTS.lg,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  h5: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.md,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  
  // Body text
  bodyLarge: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.lg,
    color: COLORS.text.primary,
  },
  bodyMedium: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: LINE_HEIGHTS.md,
    color: COLORS.text.primary,
  },
  bodySmall: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.sm,
    color: COLORS.text.primary,
  },
  bodyXSmall: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.xs,
    color: COLORS.text.primary,
  },
  
  // Labels and buttons
  labelLarge: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    lineHeight: LINE_HEIGHTS.md,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  labelMedium: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.sm,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  labelSmall: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.xs,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
}); 