/**
 * Momentum App Spacing
 * This file defines all the spacing values used in the app.
 */

// Base unit for spacing (4px)
const baseUnit = 4;

export const SPACING = {
  // Spacing values 
  xs: baseUnit,             // 4px
  sm: baseUnit * 2,         // 8px
  md: baseUnit * 4,         // 16px
  lg: baseUnit * 6,         // 24px
  xl: baseUnit * 8,         // 32px
  '2xl': baseUnit * 12,     // 48px
  '3xl': baseUnit * 16,     // 64px
  '4xl': baseUnit * 24,     // 96px
};

// Common layout padding values
export const LAYOUT = {
  // Screen padding
  screenPadding: {
    paddingHorizontal: SPACING.md,
  },
  
  // Card padding
  cardPadding: {
    padding: SPACING.md,
  },
  
  // Section spacing
  sectionSpacing: {
    marginBottom: SPACING.xl,
  },
  
  // Item spacing
  itemSpacing: {
    marginBottom: SPACING.md,
  },
};

// Border radius values
export const BORDER_RADIUS = {
  xs: baseUnit,             // 4px
  sm: baseUnit * 2,         // 8px
  md: baseUnit * 3,         // 12px
  lg: baseUnit * 5,         // 20px
  xl: baseUnit * 7,         // 28px
  full: 9999,               // Circular
};

// Shadow values for elevation
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
}; 